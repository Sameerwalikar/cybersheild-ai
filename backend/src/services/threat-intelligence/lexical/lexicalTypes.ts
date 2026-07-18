// ─────────────────────────────────────────────────────────────────────────────
// LEXICAL THREAT ANALYSIS — Types
// Fully isolated. No external API calls. No AI.
// ─────────────────────────────────────────────────────────────────────────────

export type EntropyLevel = "LOW" | "MEDIUM" | "HIGH";

export interface LexicalResult {
  /** The raw input URL */
  raw: string;
  /** Lexical risk contribution (0–100, capped before merging with engine) */
  score: number;
  /** Confidence this is a threat based on lexical signals alone */
  confidence: number;
  /** Human-readable reasons for the score */
  reasons: string[];
  /** Brand names detected in the URL */
  detectedBrands: string[];
  /** Auth/credential keywords detected */
  detectedKeywords: string[];
  /** Whether the TLD is in the suspicious list */
  suspiciousTld: boolean;
  /** Shannon entropy of the domain label */
  entropy: EntropyLevel;
  /** Number of hyphens in the domain */
  hyphenCount: number;
  /** True when brand + auth keyword co-occur (credential harvesting pattern) */
  credentialHarvestingPattern: boolean;
  /** True when a brand appears as a subdomain of a different apex domain */
  subdomainDeception: boolean;
  /** True when Punycode (xn--) is detected */
  punycodeDetected: boolean;
  /** True when the URL uses a raw IP address instead of a domain */
  ipAddressUrl: boolean;
}

export interface ParsedUrl {
  hostname:     string;
  apexDomain:   string;   // last two labels e.g. "example.com"
  tld:          string;   // last label e.g. "click"
  subdomains:   string[]; // all labels before the apex
  labels:       string[]; // all hostname labels
  pathPlusHost: string;   // hostname + pathname for keyword scanning
  raw:          string;   // original input
}
