import { applyLexicalRules } from "./lexicalRules.js";
import type { LexicalResult } from "./lexicalTypes.js";

/**
 * LexicalAnalyzer — public entry point for lexical URL analysis.
 *
 * Characteristics:
 *   - Synchronous and deterministic
 *   - Zero external API calls
 *   - Zero AI involvement
 *   - Executes in < 1 ms per URL
 *   - Never throws — returns a degraded result on any error
 */
export class LexicalAnalyzer {
  /**
   * Analyse a URL purely from its textual structure.
   * Call this BEFORE external threat intelligence providers.
   */
  analyze(url: string): LexicalResult {
    if (!url || typeof url !== "string") {
      return this.empty();
    }
    try {
      return applyLexicalRules(url.trim());
    } catch (err: any) {
      console.error("[LexicalAnalyzer] Unexpected error:", err?.message);
      return this.empty();
    }
  }

  private empty(): LexicalResult {
    return {
      raw: "",
      score: 0, confidence: 0.3, reasons: [],
      detectedBrands: [], detectedKeywords: [],
      suspiciousTld: false, entropy: "LOW", hyphenCount: 0,
      credentialHarvestingPattern: false, subdomainDeception: false,
      punycodeDetected: false, ipAddressUrl: false,
    };
  }
}

/** Singleton — stateless, safe to share */
export const lexicalAnalyzer = new LexicalAnalyzer();
