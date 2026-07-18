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
    const active = discovery.getActiveModel();
    const allModels = [aiConfig.preferredModel, ...aiConfig.fallbackModels];
    const modelsToTry = Array.from(new Set([active, ...allModels]));

    let lastError: any = null;

    for (const currentModel of modelsToTry) {
      discovery.setActiveModel(currentModel);

      const keyPrefix = this.apiKey ? this.apiKey.slice(0, 8) : "none";
      const obfuscatedUrl = `${this.baseUrl}/models/${currentModel}:generateContent?key=${keyPrefix}...`;
      const url = `${this.baseUrl}/models/${currentModel}:generateContent?key=${this.apiKey}`;
      const maxAttempts = aiConfig.retryCount + 1;

      let triggerFallback = false;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const startTime = Date.now();

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

          if (aiConfig.logging.debugLogging) {
            console.log(
              `[AI Tracing] Request ID: ${Math.random().toString(36).substring(7)} | ` +
              `Provider: gemini | Model: ${currentModel} | Attempt: ${attempt}/${maxAttempts} | ` +
              `Latency: ${latency}ms | Status: ${status}`
            );
          }

          if (!res.ok) {
            console.error(`[AI Tracing] [API ERROR DETAILED] Status: ${status} | Body: ${respText}`);
            if (isModelUnavailableError(status, respText)) {
              triggerFallback = true;
              lastError = new AIError("MODEL_UNAVAILABLE", `Model ${currentModel} unavailable: ${status}`);
              clearTimeout(timeout);
              break; // Break the attempt loop to try next model in fallbacks
            }

            if (status === 400) {
              throw new AIError("PROVIDER_ERROR", `Bad request (400) — ${respText.slice(0, 200)}`);
            }
            if (status === 401) {
              throw new AIError("AUTHENTICATION_FAILED", `Unauthorized (401)`);
            }
            if (status === 403) {
              throw new AIError("AUTHORIZATION_FAILED", `Forbidden (403)`);
            }
            if (status === 429) {
              const retryAfter = res.headers.get("retry-after");
              const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : aiConfig.retryDelayMs;
              lastError = new AIError("RATE_LIMITED", `Rate limit exceeded (429)`);
              clearTimeout(timeout);
              if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
              }
              throw lastError;
            }

            throw new AIError("PROVIDER_ERROR", `API error (${status}) — ${respText.slice(0, 200)}`);
          }

          console.log("\n=== STAGE 2: COMPLETE RAW GEMINI RESPONSE ===");
          try {
            console.log(JSON.stringify(JSON.parse(respText), null, 2));
          } catch {
            console.log(respText);
          }

          let parsedData: any;
          try {
            parsedData = JSON.parse(respText);
          } catch {
            throw new AIError("PROVIDER_ERROR", "Failed to parse Gemini response as JSON");
          }

          const text: string = parsedData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

          console.log("\n=== STAGE 3: RESPONSE PARSING ===");
          console.log(`assistant.content extracted from parsedData.candidates[0].content.parts[0].text: ${text}\n`);

          clearTimeout(timeout);
          return text;
        } catch (err: any) {
          clearTimeout(timeout);
          if (err instanceof AIError) {
            lastError = err;
          } else if (err.name === "AbortError") {
            lastError = new AIError("NETWORK_TIMEOUT", `Request timeout (${this.timeoutMs / 1000}s)`);
          } else {
            lastError = new AIError("PROVIDER_ERROR", err);
          }

          const isRetryable =
            lastError.aiCode === "NETWORK_TIMEOUT" ||
            lastError.aiCode === "RATE_LIMITED" ||
            (lastError.aiCode === "PROVIDER_ERROR" && lastError.rawError && !String(lastError.rawError.message || lastError.rawError).includes("Bad request"));

          if (attempt < maxAttempts && isRetryable && !triggerFallback) {
            await new Promise((resolve) => setTimeout(resolve, aiConfig.retryDelayMs));
          } else {
            break;
          }
        }
      }

      if (!triggerFallback) {
        throw lastError;
      }
    }

    throw new AIError("MODEL_UNAVAILABLE", "All configured models failed.");
  }
}
