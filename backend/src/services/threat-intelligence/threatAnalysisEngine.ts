import type { ThreatIntelligenceReport, EngineRiskScore } from "./types.js";
import type { LexicalResult } from "./lexical/lexicalTypes.js";
import { isTrustedDomain } from "./lexical/trustedDomains.js";
import { analyzeFile } from "./lexical/fileAnalyzer.js";
import { analyzePath } from "./lexical/pathAnalyzer.js";
import { analyzeMalwareDelivery } from "./lexical/malwareDeliveryAnalyzer.js";
import { generateVerdict } from "./lexical/verdictGenerator.js";

/**
 * ThreatAnalysisEngine
 *
 * Deterministic, pure-function risk scoring (Threat Fusion Engine).
 * AI NEVER determines risk — this engine does.
 *
 * Scoring layers (applied in order, no double-counting):
 *   1. Lexical score   — skipped if domain belongs to a trusted organization
 *   2. RDAP domain age — skipped if domain belongs to a trusted organization
 *   3. File / Path / Malware combination analysis
 *   4. Google Safe Browsing
 *   5. VirusTotal
 *
 * Final score capped at 100.
 */
export class ThreatAnalysisEngine {

  compute(
    _ruleScore: number,                       // kept for API compat — not used for URL scans
    intel: ThreatIntelligenceReport | null,
    lexical: LexicalResult | null,
  ): EngineRiskScore {
    let score = 0;
    const reasons: string[] = [];

    // Extract domain to check from RDAP or lexical
    const domainToCheck = intel?.rdap?.domain || "";
    const isTrusted = lexical ? isTrustedDomain(lexical.raw) : isTrustedDomain(domainToCheck);

    // ── Layer 1: Lexical (skip if trusted) ────────────────────────────────────
    if (lexical && lexical.score > 0 && !isTrusted) {
      score += lexical.score;
      reasons.push(...lexical.reasons);
    }

    // ── Layer 2: RDAP domain age (skip if trusted) ─────────────────────────────
    let rdapScore = 0;
    let ageInDays: number | null = null;
    if (intel?.rdap && !intel.rdap.error && !isTrusted) {
      const { rdap } = intel;
      ageInDays = rdap.ageInDays;
      if (rdap.isVeryNewDomain) {
        rdapScore += 20;
        reasons.push(`Domain registered ${rdap.ageInDays} day(s) ago — extremely new`);
      } else if (rdap.isNewDomain) {
        rdapScore += 15;
        reasons.push(`Domain registered ${rdap.ageInDays} day(s) ago — recently created`);
      }
      if (rdap.ageInDays === null) {
        rdapScore += 10;
        reasons.push("Domain registration data unavailable");
      }
      if (!rdap.registrar) {
        rdapScore += 5;
        reasons.push("Unknown or unlisted registrar");
      }
    }
    score += rdapScore;

    // ── Layer 3: File / Path / Malware Delivery combination ──────────────────
    let malwareBoost = 0;
    if (lexical && !isTrusted) {
      const fileAnalysis = analyzeFile(lexical.raw);
      const pathAnalysis = analyzePath(lexical.raw);
      const mda = analyzeMalwareDelivery(isTrusted, fileAnalysis, pathAnalysis, ageInDays);
      if (mda.detected) {
        malwareBoost = mda.scoreBoost;
        reasons.push(mda.reason);
      }
    }
    score += malwareBoost;

    // ── Layer 4: Google Safe Browsing ─────────────────────────────────────────
    let gsbScore = 0;
    if (intel?.google && !intel.google.error && intel.google.detected) {
      gsbScore = intel.google.threatTypes.includes("SOCIAL_ENGINEERING") ? 95 : 85;
      reasons.push(`Google Safe Browsing: ${intel.google.threatTypes.join(", ")}`);
    }

    // ── Layer 5: VirusTotal ───────────────────────────────────────────────────
    let vtScore = 0;
    if (intel?.virusTotal && !intel.virusTotal.error) {
      const { virusTotal: vt } = intel;
      if (vt.maliciousCount >= 10)      { vtScore = 95; reasons.push(`VirusTotal: ${vt.maliciousCount} vendors flagged malicious`); }
      else if (vt.maliciousCount >= 5)  { vtScore = 90; reasons.push(`VirusTotal: ${vt.maliciousCount} vendors flagged malicious`); }
      else if (vt.maliciousCount >= 2)  { vtScore = 75; reasons.push(`VirusTotal: ${vt.maliciousCount} vendors flagged malicious`); }
      else if (vt.maliciousCount === 1) { vtScore = 35; reasons.push("VirusTotal: 1 vendor flagged malicious"); }

      if (vt.suspiciousCount >= 3) { score += 10; reasons.push(`VirusTotal: ${vt.suspiciousCount} vendors flagged suspicious`); }
      if (vt.communityScore < -5)  { score += 8;  reasons.push(`VirusTotal community score: ${vt.communityScore}`); }
    }

    // Threat Fusion: If Google Safe Browsing or VirusTotal (>= 2 vendors) positively identifies,
    // that feeds dictate the minimum risk score. Safe Browsing Clean status NEVER decreases this score.
    if (gsbScore > 0 || vtScore >= 75) {
      score = Math.max(score, gsbScore, vtScore);
    } else if (vtScore > 0) {
      score = Math.max(score, vtScore);
    }

    score = Math.min(100, Math.max(0, score));

    // Separation of Confidence:
    let confidence = 0.5;
    if (isTrusted) {
      confidence = 0.99;
    } else {
      let active = 0;
      if (lexical && lexical.reasons.length > 0) active++;
      if (intel?.google && !intel.google.error) active++;
      if (intel?.virusTotal && !intel.virusTotal.error) active++;
      if (intel?.rdap && !intel.rdap.error) active++;

      confidence = Math.min(0.99, 0.55 + active * 0.08 + Math.min(reasons.length, 6) * 0.03);
      if (intel?.google?.detected) confidence = Math.max(confidence, 0.95);
      if (intel?.virusTotal && intel.virusTotal.maliciousCount >= 2) confidence = Math.max(confidence, 0.90);
    }

    // Generate Verdict Details
    const verdictDetails = generateVerdict(score, reasons);

    return {
      score,
      level:      this.toLevel(score),
      confidence,
      reasons,
      verdict:    verdictDetails.verdict,
      headline:   verdictDetails.headline,
      recommendation: verdictDetails.recommendation,
    };
  }

  private toLevel(score: number): EngineRiskScore["level"] {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    if (score >= 20) return "LOW";
    return "SAFE";
  }
}

export const threatAnalysisEngine = new ThreatAnalysisEngine();
