import { getAIProvider } from "./ai.provider.js";
import type { ThreatContext, AIAnalysisResponse } from "./types.js";
import type { EnrichedThreatContext } from "../../services/threat-intelligence/types.js";
import { buildTextAnalysisPrompt, buildEnrichedAnalysisPrompt } from "./prompts/text-analysis.prompt.js";
import { buildImageAnalysisPrompt } from "./prompts/image-analysis.prompt.js";

const SYSTEM_PROMPT =
  "You are AEGIS, a cybersecurity AI assistant for CyberShield AI — India's digital public safety platform. " +
  "Respond concisely and accurately in JSON when requested.";

export const aiService = {
  /**
   * Analyze text content (SMS, UPI, transcript) using rule-engine context.
   * Used for non-URL scan types where threat intel is not applicable.
   */
  async analyzeText(context: ThreatContext): Promise<AIAnalysisResponse> {
    const provider = getAIProvider();
    const prompt   = buildTextAnalysisPrompt(context);
    const response = await provider.analyzeText(prompt, SYSTEM_PROMPT);
    return parseAnalysisResponse(response, context);
  },

  /**
   * Analyze a URL with full threat intel context.
   * Gemini explains pre-computed evidence — never re-scores.
   */
  async analyzeEnrichedUrl(enriched: EnrichedThreatContext): Promise<{
    citizenExplanation: string;
    policeSummary: string;
    technicalExplanation: string;
    explanation: string;
    citizenAdvice: string;
  }> {
    const provider = getAIProvider();
    const prompt   = buildEnrichedAnalysisPrompt(enriched);
    const response = await provider.analyzeText(prompt, SYSTEM_PROMPT);
    return parseEnrichedResponse(response, enriched);
  },

  /**
   * Analyze an image (screenshot, fake page, QR) using the vision model.
   */
  async analyzeImage(imageBase64: string, mimeType: string, description?: string): Promise<AIAnalysisResponse> {
    const provider = getAIProvider();
    const prompt   = buildImageAnalysisPrompt(description);
    const response = await provider.analyzeImage(imageBase64, mimeType, prompt);
    return parseAnalysisResponse(response);
  },

  /** Generate citizen-friendly safety advice. */
  async generateCitizenAdvice(context: ThreatContext): Promise<string> {
    const provider = getAIProvider();
    return provider.generateCitizenAdvice(context);
  },

  /** Generate intelligence notes for law enforcement. */
  async generatePoliceSummary(context: ThreatContext): Promise<string> {
    const provider = getAIProvider();
    return provider.generatePoliceSummary(context);
  },

  /** Extract identifiable entities (URLs, phones, UPIs, emails) from content. */
  async extractThreatSignals(content: string): Promise<string[]> {
    const provider = getAIProvider();
    return provider.extractThreatSignals(content);
  },

  /** Generate a one-line threat summary for dashboards. */
  async summarizeThreat(context: ThreatContext): Promise<string> {
    const provider = getAIProvider();
    return provider.summarizeThreat(context);
  },
};

// ─── Response parsers ────────────────────────────────────────────────────────

function parseAnalysisResponse(raw: string, context?: ThreatContext): AIAnalysisResponse {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        riskScore:       parsed.riskScore       ?? context?.riskScore ?? 0,
        confidence:      parsed.confidence      ?? 0.5,
        category:        parsed.category        ?? "unknown",
        explanation:     parsed.explanation     ?? "Analysis complete.",
        detectedSignals: Array.isArray(parsed.detectedSignals) ? parsed.detectedSignals : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        aiSummary:       parsed.aiSummary       ?? "No summary available.",
      };
    }
  } catch { /* fall through */ }

  return {
    riskScore:       context?.riskScore ?? 0,
    confidence:      0.5,
    category:        "unknown",
    explanation:     raw.slice(0, 300) || "Analysis complete.",
    detectedSignals: context?.signals.map((s) => s.label) ?? [],
    recommendations: ["Review the content carefully.", "Report if suspicious."],
    aiSummary:       "AI analysis completed.",
  };
}

function parseEnrichedResponse(
  raw: string,
  ctx: EnrichedThreatContext,
): {
  citizenExplanation: string;
  policeSummary: string;
  technicalExplanation: string;
  explanation: string;
  citizenAdvice: string;
} {
  const base = {
    citizenExplanation: "Analysis complete.",
    policeSummary: "Investigation recommended.",
    technicalExplanation: "No technical details available.",
    explanation: "Analysis complete.",
    citizenAdvice: "Analysis complete.",
  };

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const p = JSON.parse(jsonMatch[0]);
      const citizenExplanation = p.citizenExplanation || base.citizenExplanation;
      const policeSummary = p.policeSummary || base.policeSummary;
      const technicalExplanation = p.technicalExplanation || base.technicalExplanation;
      return {
        citizenExplanation,
        policeSummary,
        technicalExplanation,
        explanation: citizenExplanation,
        citizenAdvice: citizenExplanation,
      };
    }
  } catch { /* fall through */ }

  return base;
}
