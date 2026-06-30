import { getAIProvider } from "./ai.provider.js";
import type { ThreatContext, AIAnalysisResponse } from "./types.js";
import { buildTextAnalysisPrompt } from "./prompts/text-analysis.prompt.js";
import { buildImageAnalysisPrompt } from "./prompts/image-analysis.prompt.js";

const SYSTEM_PROMPT = "You are AEGIS, a cybersecurity AI assistant for CyberShield AI — India's digital public safety platform. Respond concisely and accurately in JSON when requested.";

export const aiService = {
  /**
   * Analyze text content (SMS, URL, UPI, transcript) using the text model.
   * The rule engine provides the risk score — AI enriches with explanation.
   */
  async analyzeText(context: ThreatContext): Promise<AIAnalysisResponse> {
    const provider = getAIProvider();
    const prompt = buildTextAnalysisPrompt(context);
    const response = await provider.analyzeText(prompt, SYSTEM_PROMPT);
    return parseAnalysisResponse(response, context);
  },

  /**
   * Analyze an image (screenshot, fake page, QR) using the vision model.
   */
  async analyzeImage(imageBase64: string, mimeType: string, description?: string): Promise<AIAnalysisResponse> {
    const provider = getAIProvider();
    const prompt = buildImageAnalysisPrompt(description);
    const response = await provider.analyzeImage(imageBase64, mimeType, prompt);
    return parseAnalysisResponse(response);
  },

  /**
   * Generate citizen-friendly safety advice.
   */
  async generateCitizenAdvice(context: ThreatContext): Promise<string> {
    const provider = getAIProvider();
    return provider.generateCitizenAdvice(context);
  },

  /**
   * Generate intelligence notes for law enforcement.
   */
  async generatePoliceSummary(context: ThreatContext): Promise<string> {
    const provider = getAIProvider();
    return provider.generatePoliceSummary(context);
  },

  /**
   * Extract identifiable entities (URLs, phones, UPIs, emails) from content.
   */
  async extractThreatSignals(content: string): Promise<string[]> {
    const provider = getAIProvider();
    return provider.extractThreatSignals(content);
  },

  /**
   * Generate a one-line threat summary for dashboards.
   */
  async summarizeThreat(context: ThreatContext): Promise<string> {
    const provider = getAIProvider();
    return provider.summarizeThreat(context);
  },
};

function parseAnalysisResponse(raw: string, context?: ThreatContext): AIAnalysisResponse {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        riskScore: parsed.riskScore ?? context?.riskScore ?? 0,
        confidence: parsed.confidence ?? 0.5,
        category: parsed.category ?? "unknown",
        explanation: parsed.explanation ?? "Analysis complete.",
        detectedSignals: Array.isArray(parsed.detectedSignals) ? parsed.detectedSignals : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        aiSummary: parsed.aiSummary ?? "No summary available.",
      };
    }
  } catch {}

  // Fallback if JSON parsing fails
  return {
    riskScore: context?.riskScore ?? 0,
    confidence: 0.5,
    category: "unknown",
    explanation: raw.slice(0, 300) || "Analysis complete.",
    detectedSignals: context?.signals.map((s) => s.label) ?? [],
    recommendations: ["Review the content carefully.", "Report if suspicious."],
    aiSummary: "AI analysis completed.",
  };
}
