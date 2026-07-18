import type { AIProvider, ThreatContext } from "../types.js";
import { buildCitizenAdvicePrompt } from "../prompts/citizen-advice.prompt.js";
import { buildPoliceSummaryPrompt } from "../prompts/police-summary.prompt.js";
import { aiConfig } from "../../../config/ai.config.js";

/**
 * GeminiProvider — wraps Google Gemini REST API (v1beta).
 *
 * Gemini responsibilities:
 *   - Explain threat evidence in human-readable language (citizen + police)
 *   - Never determine whether a URL is phishing (that's the ThreatAnalysisEngine)
 *   - Generate structured JSON responses consumed by the scanner pipeline
 */
export class GeminiProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor() {
    this.apiKey  = aiConfig.gemini.apiKey;
    this.model   = aiConfig.gemini.model;
    this.baseUrl = aiConfig.gemini.baseUrl;
    this.timeoutMs = aiConfig.retry.requestTimeoutMs;

    if (!this.apiKey) {
      console.warn("⚠️  GEMINI_API_KEY not set — provider will fail on requests.");
    }
  }

  // ─── AIProvider interface ────────────────────────────────────────────

  async analyzeText(prompt: string, systemPrompt?: string): Promise<string> {
    const contents: any[] = [];

    // Gemini uses a "system_instruction" field for system prompts
    const body: any = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 1024,
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
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 1024,
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
    const keyPrefix = this.apiKey ? this.apiKey.slice(0, 8) : "none";
    const obfuscatedUrl = `${this.baseUrl}/models/${this.model}:generateContent?key=${keyPrefix}...`;
    
    if (aiConfig.logging.debugLogging) {
      console.log(`[AI Tracing] Provider Selected: Google Gemini`);
      console.log(`[AI Tracing] Model Selected: ${this.model}`);
      console.log(`[AI Tracing] Endpoint Selected: ${obfuscatedUrl}`);
      console.log(`[AI Tracing] First 8 chars of API key: ${keyPrefix}`);
      console.log(`[AI Tracing] HTTP Request Body: ${JSON.stringify(body)}`);
    }

    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    let lastError: any = null;
    const maxAttempts = aiConfig.retry.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const status = res.status;
        const respText = await res.text().catch(() => "Unable to read response text");
        if (aiConfig.logging.debugLogging) {
          console.log(`[AI Tracing] [Attempt ${attempt}/${maxAttempts}] HTTP Response Status: ${status}`);
        }

        if (!res.ok) {
          console.error(`[AI Tracing] [Attempt ${attempt}/${maxAttempts}] COMPLETE Response Body:\n${respText}`);
          // Retry logic: "Retry ONLY for network timeout, 502, 503, 504. Do NOT retry 429, 401, 403, 400. Fail immediately."
          const isRetryable = status === 502 || status === 503 || status === 504;
          if (status === 400) throw new Error(`Gemini API: Bad request (400) — ${respText.slice(0, 200)}`);
          if (status === 401 || status === 403) throw new Error(`Gemini API: Permission Denied/Unauthorized (403) — ${respText.slice(0, 200)}`);
          if (status === 429) throw new Error("Gemini API: Rate limit exceeded (429)");
          
          if (!isRetryable) {
            // Fail immediately, break the attempt loop
            throw new Error(`Gemini API non-retryable error (${status}) — ${respText.slice(0, 200)}`);
          }
          throw new Error(`Gemini API error (${status}) — ${respText.slice(0, 200)}`);
        }

        let parsedData: any;
        try {
          parsedData = JSON.parse(respText);
        } catch {
          throw new Error("Failed to parse Gemini response as JSON");
        }

        const text: string = parsedData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (aiConfig.logging.debugLogging) {
          console.log(`[AI Tracing] Parsed Response: ${text.slice(0, 150)}...`);
        }
        clearTimeout(timeout);
        return text;
      } catch (err: any) {
        lastError = err;
        clearTimeout(timeout);
        if (err.name === "AbortError") {
          lastError = new Error(`Gemini API: Request timeout (${this.timeoutMs / 1000}s)`);
        }
        console.error(`[AI Tracing] [Attempt ${attempt}/${maxAttempts}] Error: ${lastError.message}`);
        
        // If error is non-retryable (e.g. 400, 401, 403, 429 thrown in block above), do not retry
        const isRetryableError = !err.message.includes("Bad request") && 
                                 !err.message.includes("Permission Denied") && 
                                 !err.message.includes("Rate limit exceeded") &&
                                 !err.message.includes("non-retryable");
        
        if (attempt < maxAttempts && isRetryableError) {
          if (aiConfig.logging.debugLogging) {
            console.warn(`[AI Tracing] Retrying in ${aiConfig.retry.retryDelayMs}ms...`);
          }
          await new Promise((resolve) => setTimeout(resolve, aiConfig.retry.retryDelayMs));
        } else {
          // If we reached max attempts or the error is not retryable, break/throw
          break;
        }
      }
    }

    // Log the final exception before throwing/returning fallback
    console.error(`[AI Tracing] Gemini API call completely failed:`, lastError.message || lastError);

    // If request expected JSON, return structured warning object
    const bodyStr = JSON.stringify(body);
    if (bodyStr.includes("citizenExplanation") || bodyStr.includes("riskScore")) {
      return JSON.stringify({
        riskScore: 50,
        confidence: 0.5,
        category: "unknown",
        explanation: "I'm temporarily unable to access my AI reasoning engine. Threat scanning services remain available.",
        detectedSignals: ["AI_TIMEOUT_FALLBACK"],
        recommendations: ["Manually verify URL safety.", "Ensure threat indicators match expectations."],
        aiSummary: "I'm temporarily unable to access my AI reasoning engine. Threat scanning services remain available.",
        citizenExplanation: "I'm temporarily unable to access my AI reasoning engine. Threat scanning services remain available.",
        policeSummary: "AI copilot offline. Manual review of scanner parameters required.",
        technicalExplanation: "Gemini API gateway timeout or quota limits exceeded."
      });
    }

    throw new Error("I'm temporarily unable to access my AI reasoning engine. Threat scanning services remain available.");
  }
}
