import validator from "validator";

function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[len1][len2];
}

const COMMON_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "sbi.co.in", "hdfcbank.com", "icicibank.com", "amazon.in", "paytm.com"
];

export function analyzeEmail(email: string) {
  const clean = email.replace(/^mailto:/i, "").trim();
  const signals: any[] = [];
  let score = 0;

  if (!validator.isEmail(clean)) {
    signals.push({
      label: "Malformed Email Address",
      severity: "HIGH",
      confidence: 0.95,
      description: "The email address format is invalid."
    });
    score += 45;
  } else {
    const domain = clean.split("@")[1]?.toLowerCase() || "";
    
    for (const common of COMMON_DOMAINS) {
      if (domain !== common) {
        const dist = levenshteinDistance(domain, common);
        if (dist >= 1 && dist <= 2) {
          signals.push({
            label: "Lookalike Email Domain",
            severity: "CRITICAL",
            confidence: 0.9,
            description: `Domain '${domain}' is highly similar to '${common}' — likely typosquatting.`
          });
          score += 55;
          break;
        }
      }
    }
  }

  if (signals.length === 0) {
    signals.push({
      label: "Valid Email Domain",
      severity: "LOW",
      confidence: 0.9,
      description: "Email address format is valid and uses a standard domain."
    });
  }

  return {
    score,
    signals,
    summary: score > 0 ? "Suspicious email properties detected." : "Email appears legitimate.",
    recommendation: score > 0 ? "Do not reply or click on links sent from this sender." : "Verify sender identity."
  };
}
