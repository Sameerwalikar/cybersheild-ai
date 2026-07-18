// ─── PATH ANALYZER ────────────────────────────────────────────────────────────

const PATH_KEYWORDS = new Set([
  "download", "payload", "loader", "stub", "update", "install", "invoice",
  "payment", "secure", "verify", "login", "signin", "document", "unlock",
  "activation", "setup", "dropper"
]);

export interface PathAnalysisResult {
  detectedKeywords: string[];
  score: number;
  confidence: number;
  reasons: string[];
}

/**
 * Analyzes URL path segments to detect suspicious keywords and combination patterns.
 */
export function analyzePath(url: string): PathAnalysisResult {
  const result: PathAnalysisResult = {
    detectedKeywords: [],
    score: 0,
    confidence: 1.0,
    reasons: [],
  };

  if (!url) return result;

  try {
    const cleaned = url.trim().toLowerCase();
    const withScheme = cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
    const u = new URL(withScheme);
    const pathname = u.pathname;

    // Split path into segments and scan
    const segments = pathname.split("/").filter(Boolean);
    const foundKeywords = new Set<string>();

    for (const segment of segments) {
      // Check exact match or boundary match for keywords
      for (const kw of PATH_KEYWORDS) {
        if (segment === kw || segment.includes(`_${kw}`) || segment.includes(`-${kw}`)) {
          foundKeywords.add(kw);
        }
      }
    }

    if (foundKeywords.size > 0) {
      result.detectedKeywords = [...foundKeywords];
      result.confidence = 0.85;
      
      // Calculate score based on keyword counts
      let score = foundKeywords.size * 15;
      
      // Extra booster: installer/loader combo pattern (e.g. /download/update)
      const hasDownload = foundKeywords.has("download") || foundKeywords.has("payload") || foundKeywords.has("dropper");
      const hasUpdate = foundKeywords.has("update") || foundKeywords.has("install") || foundKeywords.has("setup");
      
      if (hasDownload && hasUpdate) {
        score += 25;
        result.reasons.push("Suspicious installation/loader combination pattern detected in URL path");
      }

      result.score = Math.min(score, 50);
      result.reasons.push(`Suspicious keyword(s) detected in path: ${result.detectedKeywords.join(", ")}`);
    }

  } catch {
    // Parsing error
  }

  return result;
}
