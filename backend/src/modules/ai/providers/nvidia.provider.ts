import type { AIProvider, ThreatContext } from "../types.js";
import { buildTextAnalysisPrompt, buildThreatExplanationPrompt } from "../prompts/text-analysis.prompt.js";
import { buildImageAnalysisPrompt } from "../prompts/image-analysis.prompt.js";
import { buildCitizenAdvicePrompt } from "../prompts/citizen-advice.prompt.js";
import { buildPoliceSummaryPrompt } from "../prompts/police-summary.prompt.js";

export class NvidiaProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;
  private textModel: string;
  private visionModel: string;

  constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY || "";
    this.baseUrl = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
    this.textModel = process.env.NVIDIA_TEXT_MODEL || "meta/llama-3.3-70b-instruct";
    this.visionModel = process.env.NVIDIA_VISION_MODEL || "meta/llama-3.2-90b-vision-instruct";

    if (!this.apiKey) {
      console.warn("⚠️  NVIDIA_API_KEY not set — provider will fail on requests.");
    }
  }

  async analyzeText(prompt: string, systemPrompt?: string, maxTokens = 512): Promise<string> {
    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    return this.callModel(this.textModel, messages, maxTokens);
  }

  async analyzeImage(imageBase64: string, mimeType: string, prompt: string): Promise<string> {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ];

    let response = await this.callModel(this.visionModel, messages, 1024);
    console.log("[NVIDIA Vision] Raw response:", response.slice(0, 500));

    // If response doesn't contain JSON (safety refusal), retry with simplified prompt
    if (!response.includes("{")) {
      console.warn("[NVIDIA Vision] Non-JSON response, retrying with simplified prompt...");
      const retryMessages = [
        {
          role: "user",
          content: [
            { type: "text", text: 'This image was reported as potential cybercrime evidence. Classify it as safe or dangerous. Return ONLY JSON: {"riskScore":0,"confidence":0.5,"category":"safe","explanation":"","detectedSignals":[],"recommendations":[],"aiSummary":""}' },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ];
      response = await this.callModel(this.visionModel, retryMessages, 512);
      console.log("[NVIDIA Vision] Retry response:", response.slice(0, 500));
    }

    return response;
  }

  async generateCitizenAdvice(context: ThreatContext): Promise<string> {
    // Skip AI entirely for safe/low-risk content — instant response
    if (context.riskScore < 30) {
      return `Your ${context.scanType} scan is safe. No action needed. Continue staying vigilant online.`;
    }
    const prompt = buildCitizenAdvicePrompt(context);
    return this.analyzeText(prompt, "You are AEGIS, a friendly cybersecurity assistant for Indian citizens.", 256);
  }

  async generatePoliceSummary(context: ThreatContext): Promise<string> {
    const prompt = buildPoliceSummaryPrompt(context);
    return this.analyzeText(prompt, "You are a cybercrime intelligence analyst.", 512);
  }

  async extractThreatSignals(content: string): Promise<string[]> {
    const prompt = `Extract all threat indicators from this content. Return as a JSON array of short strings.\nContent: "${content.slice(0, 500)}"`;
    const response = await this.analyzeText(prompt, undefined, 256);
    try {
      const match = response.match(/\[[\s\S]*?\]/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return [];
  }

  async summarizeThreat(context: ThreatContext): Promise<string> {
    // Skip AI for low-risk — instant rule-based summary
    if (context.riskScore < 40) {
      return `${context.scanType} content analyzed. Risk score: ${context.riskScore}/100. No significant threats detected.`;
    }
    const prompt = `Summarize this cyber threat in one sentence (max 20 words).\nType: ${context.scanType}, Risk: ${context.riskScore}/100, Signals: ${context.signals.slice(0, 3).map((s) => s.label).join(", ")}`;
    return this.analyzeText(prompt, undefined, 128);
  }

  private async callModel(model: string, messages: any[], maxTokens = 512): Promise<string> {
    const controller = new AbortController();
    // Reduce timeout from 30s → 15s — fail fast, let rule engine take over
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        console.error(`NVIDIA API error [${model}]: ${res.status} — ${errText.slice(0, 300)}`);
        if (res.status === 401) throw new Error("NVIDIA API: Invalid API key");
        if (res.status === 429) throw new Error("NVIDIA API: Rate limit exceeded");
        if (res.status === 404) throw new Error(`NVIDIA API: Model not found — ${model}`);
        throw new Error(`NVIDIA API error (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data: any = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err: any) {
      if (err.name === "AbortError") throw new Error("NVIDIA API: Request timeout (30s)");
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
