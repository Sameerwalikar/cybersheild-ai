import type { AIProvider, ThreatContext } from "../types.js";
import { buildCitizenAdvicePrompt } from "../prompts/citizen-advice.prompt.js";
import { buildPoliceSummaryPrompt } from "../prompts/police-summary.prompt.js";
import { aiConfig } from "../../../config/ai.config.js";
import { AIError } from "../errors.js";
import { ModelDiscoveryService } from "../model-discovery.js";

function isModelUnavailableError(status: number, bodyText: string): boolean {
  if (status === 404) return true;
  const lower = bodyText.toLowerCase();
  return (
    lower.includes("deprecated") ||
    lower.includes("model not found") ||
    lower.includes("unknown model") ||
    lower.includes("not_found") ||
    lower.includes("no longer available")
  );
}

export class GeminiProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.apiKey = aiConfig.gemini.apiKey;
    this.baseUrl = aiConfig.gemini.baseUrl;
    this.timeoutMs = aiConfig.timeoutMs;

    if (!this.apiKey) {
      console.warn("⚠️  GEMINI_API_KEY not set — provider will fail on requests.");
    }
  }

  // ─── AIProvider interface ────────────────────────────────────────────

  async analyzeText(prompt: string, systemPrompt?: string): Promise<string> {
    const body: any = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: aiConfig.temperature,
        topP: aiConfig.topP,
        maxOutputTokens: aiConfig.maxOutputTokens,
        responseMimeType: "text/plain",
      },
    };

    if (systemPrompt) {
      body.system_instruction = { parts: [{ text: systemPrompt }] };
    }

    return this.callModel(body);
  }

  async analyzeImage(imageBase64: string, mimeType: string, prompt: string): Promise<string> {
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: aiConfig.temperature,
        topP: aiConfig.topP,
        maxOutputTokens: aiConfig.maxOutputTokens,
      },
    };

    return this.callModel(body);
  }

  async generateCitizenAdvice(context: ThreatContext): Promise<string> {
    if (context.riskScore < 30) {
      return `Your ${context.scanType} scan is safe. No action needed. Continue staying vigilant online.`;
    }
    const prompt = buildCitizenAdvicePrompt(context);
    return this.analyzeText(
      prompt,
      "You are AEGIS, a friendly cybersecurity assistant for Indian citizens. Reply in simple language.",
    );
  }

  async generatePoliceSummary(context: ThreatContext): Promise<string> {
    const prompt = buildPoliceSummaryPrompt(context);
    return this.analyzeText(prompt, "You are a cybercrime intelligence analyst for Indian Cyber Police.");
  }

  async extractThreatSignals(content: string): Promise<string[]> {
    const prompt = `Extract all threat indicators from this content. Return as a JSON array of short strings.
Content: "${content.slice(0, 500)}"
Reply with ONLY the JSON array, nothing else.`;
    const response = await this.analyzeText(prompt);
    try {
      const match = response.match(/\[[\s\S]*?\]/);
      if (match) return JSON.parse(match[0]);
    } catch { /* fall through */ }
    return [];
  }

  async summarizeThreat(context: ThreatContext): Promise<string> {
    if (context.riskScore < 40) {
      return `${context.scanType} content analyzed. Risk score: ${context.riskScore}/100. No significant threats detected.`;
    }
    const prompt = `Summarize this cyber threat in one sentence (max 20 words).
Type: ${context.scanType}, Risk: ${context.riskScore}/100, Signals: ${context.signals.slice(0, 3).map((s) => s.label).join(", ")}`;
    return this.analyzeText(prompt);
  }

  // ─── Private HTTP layer ──────────────────────────────────────────────

  private async callModel(body: object): Promise<string> {
    const discovery = ModelDiscoveryService.getInstance();
    
    // Visited models to prevent loops in this request
    const visitedModels = new Set<string>();
    let lastError: any = null;
    let fallbackCount = 0;

    while (true) {
      const availableModels = discovery.getAvailableModels().filter(m => !visitedModels.has(m));
      
      if (availableModels.length === 0) {
        throw new AIError("MODEL_UNAVAILABLE", "All compatible discovered models failed.");
      }

      const currentModel = availableModels[0];
      visitedModels.add(currentModel);
      discovery.setActiveModel(currentModel);

      const maxAttempts = aiConfig.retryCount + 1;
      let shouldSwitchModel = false;
      let modelSwitchReason = "";

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const startTime = Date.now();
        const url = `${this.baseUrl}/models/${currentModel}:generateContent?key=${this.apiKey}`;

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          const status = res.status;
          const respText = await res.text().catch(() => "Unable to read response text");
          const latency = Date.now() - startTime;

          if (res.ok) {
            clearTimeout(timeout);
            
            console.log(
              `[AI Tracing] Success | Provider: gemini | Preferred Model: ${aiConfig.preferredModel} | ` +
              `Selected Model: ${currentModel} | Fallback Count: ${fallbackCount} | Latency: ${latency}ms`
            );

            let parsedData: any;
            try {
              parsedData = JSON.parse(respText);
            } catch {
              throw new AIError("PROVIDER_ERROR", "Failed to parse Gemini response as JSON");
            }

            const text: string = parsedData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            
            if (aiConfig.logging.debugLogging) {
              console.log("\n=== STAGE 2: COMPLETE RAW GEMINI RESPONSE ===");
              console.log(JSON.stringify(parsedData, null, 2));
              console.log("\n=== STAGE 3: RESPONSE PARSING ===");
              console.log(`assistant.content: ${text}\n`);
            }

            return text;
          }

          clearTimeout(timeout);
          console.error(`[AI Tracing] Error | Model: ${currentModel} | Status: ${status} | Body: ${respText}`);

          if (isModelUnavailableError(status, respText)) {
            modelSwitchReason = `Model unavailable/deprecated (${status})`;
            discovery.markExhausted(currentModel, modelSwitchReason);
            shouldSwitchModel = true;
            lastError = new AIError("MODEL_UNAVAILABLE", `Model ${currentModel} unavailable: ${status}`);
            break;
          }

          if (status === 401 || status === 403) {
            throw new AIError("AUTHENTICATION_FAILED", `Auth failed (${status})`);
          }

          if (status === 429) {
            const isDailyLimit = respText.toLowerCase().includes("daily") || 
                                 respText.toLowerCase().includes("quota") ||
                                 respText.toLowerCase().includes("limit exceeded");
            
            if (isDailyLimit) {
              modelSwitchReason = "Daily quota exceeded";
              discovery.markExhausted(currentModel, modelSwitchReason);
              shouldSwitchModel = true;
              lastError = new AIError("RATE_LIMITED", `Daily quota exceeded for ${currentModel}`);
              break; 
            }

            const retryAfter = res.headers.get("retry-after");
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : aiConfig.retryDelayMs;
            
            lastError = new AIError("RATE_LIMITED", `Rate limit exceeded (429)`);
            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            } else {
              modelSwitchReason = "Rate limit retry exhausted";
              discovery.markExhausted(currentModel, modelSwitchReason);
              shouldSwitchModel = true;
              break;
            }
          }

          if ([500, 502, 503, 504].includes(status)) {
            lastError = new AIError("PROVIDER_ERROR", `Transient server error (${status})`);
            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, aiConfig.retryDelayMs));
              continue;
            } else {
              modelSwitchReason = `Transient error retry exhausted (${status})`;
              shouldSwitchModel = true;
              break;
            }
          }

          throw new AIError("PROVIDER_ERROR", `API error (${status}) — ${respText.slice(0, 200)}`);

        } catch (err: any) {
          clearTimeout(timeout);
          if (err instanceof AIError) {
            lastError = err;
          } else if (err.name === "AbortError") {
            lastError = new AIError("NETWORK_TIMEOUT", `Request timeout (${this.timeoutMs / 1000}s)`);
          } else {
            lastError = new AIError("PROVIDER_ERROR", err.message || err);
          }

          const isTransient =
            lastError.aiCode === "NETWORK_TIMEOUT" ||
            lastError.aiCode === "PROVIDER_ERROR"; 

          if (attempt < maxAttempts && isTransient) {
            await new Promise((resolve) => setTimeout(resolve, aiConfig.retryDelayMs));
          } else {
            modelSwitchReason = `Exception: ${lastError.message || lastError.aiCode}`;
            shouldSwitchModel = true;
            break;
          }
        }
      }

      if (shouldSwitchModel) {
        fallbackCount++;
        console.warn(
          `[AI Fallback] Switch Model | Provider: gemini | Preferred Model: ${aiConfig.preferredModel} | ` +
          `Failed Model: ${currentModel} | Reason: ${modelSwitchReason} | Fallback Count: ${fallbackCount}`
        );
        continue;
      }

      throw lastError;
    }
  }
}
