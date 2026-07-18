const SAFE_SCHEMES = [
  "mailto:", "tel:", "sms:", "smsto:", "https:", "http:", "market://", "intent://"
];

export function analyzeDeepLink(content: string) {
  const signals: any[] = [];
  let score = 0;

  const match = content.match(/^([^:]+):/);
  const scheme = match ? match[1] + ":" : "";

  const isSafe = SAFE_SCHEMES.some(s => scheme.toLowerCase().startsWith(s.toLowerCase()));

  if (!isSafe) {
    signals.push({
      label: "Custom Deep Link Scheme",
      severity: "MEDIUM",
      confidence: 0.85,
      description: `Custom app scheme '${scheme}' detected. These bypass standard browser filters.`
    });
    score += 25;
  }

  if (signals.length === 0) {
    signals.push({
      label: "Standard Mobile Scheme",
      severity: "LOW",
      confidence: 0.9,
      description: "Uses standard app-launch or web protocol scheme."
    });
  }

  return {
    score,
    signals,
    summary: score > 0 ? "App-launch custom URI detected." : "URI scheme is standard.",
    recommendation: score > 0 ? "Only open if you trust the target application." : "Standard verification."
  };
}
