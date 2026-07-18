// ─────────────────────────────────────────────────────────────────────
// THREAT INTELLIGENCE — Shared Types
// ─────────────────────────────────────────────────────────────────────

export type { LexicalResult, EntropyLevel } from "./lexical/lexicalTypes.js";

/** Result from Google Safe Browsing API */
export interface GoogleSafeBrowsingResult {
  detected: boolean;
  threatTypes: string[];
  provider: "google";
  error?: string;
}

/** Result from VirusTotal URL reputation API */
export interface VirusTotalResult {
  maliciousCount: number;
  suspiciousCount: number;
  harmlessCount: number;
  undetectedCount: number;
  communityScore: number;
  categories: string[];
  lastAnalysisDate: string | null;
  provider: "virustotal";
  error?: string;
}

/** Result from RDAP domain lookup */
export interface RdapResult {
  domain: string;
  registrar: string | null;
  registrationDate: string | null;
  expirationDate: string | null;
  status: string[];
  ageInDays: number | null;
  isNewDomain: boolean;
  isVeryNewDomain: boolean;
  provider: "rdap";
  error?: string;
}

/** Unified output from ThreatIntelligenceService (external providers only) */
export interface ThreatIntelligenceReport {
  google:     GoogleSafeBrowsingResult | null;
  virusTotal: VirusTotalResult         | null;
  rdap:       RdapResult               | null;
}

/** Deterministic risk score computed by ThreatAnalysisEngine */
export interface EngineRiskScore {
  score: number;
  level: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  reasons: string[];
  verdict?: string;
  headline?: string;
  recommendation?: string;
}

/**
 * Full enriched context passed to Gemini for explanation generation.
 * lexical is always present for URL scans; intel may be null if all
 * external providers fail.
 */
export interface EnrichedThreatContext {
  scanType: string;
  content: string;

  ruleScore: number;
  ruleLevel: string;
  ruleSignals: { label: string; severity: string; confidence: number; description: string }[];

  /** Lexical analysis — always present for URL scans */
  lexical: import("./lexical/lexicalTypes.js").LexicalResult | null;

  /** External threat intel — present when at least one provider responded */
  intel: ThreatIntelligenceReport | null;

  /** Final deterministic score from ThreatAnalysisEngine */
  engineScore: EngineRiskScore;
}
