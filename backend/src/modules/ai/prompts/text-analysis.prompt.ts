import type { ThreatContext } from "../types.js";
import type { EnrichedThreatContext } from "../../../services/threat-intelligence/types.js";

// ─── Original prompt (non-URL scans) ────────────────────────────────────────

export function buildTextAnalysisPrompt(context: ThreatContext): string {
  const signalList = context.signals
    .map((s) => `- ${s.label} (${s.severity}, ${Math.round(s.confidence * 100)}%): ${s.description}`)
    .join("\n");

  return `Analyze this ${context.scanType} for cyber threats. Our rule engine has already scored it ${context.riskScore}/100 (${context.riskLevel}).

CONTENT:
"${context.content.slice(0, 800)}"

DETECTED SIGNALS:
${signalList || "None"}

Respond in JSON:
{
  "riskScore": ${context.riskScore},
  "confidence": <0-1>,
  "category": "<phishing|scam|malware|social_engineering|fraud|safe>",
  "explanation": "<2-3 sentence explanation for citizens>",
  "detectedSignals": ["<signal1>", "<signal2>"],
  "recommendations": ["<action1>", "<action2>", "<action3>"],
  "aiSummary": "<one sentence summary>"
}

Use Indian context. Be precise. Do not minimise real threats.`;
}

// ─── Enriched prompt (URL scans with full threat intel) ──────────────────────

/**
 * Builds a structured prompt for URL scans that have been through the
 * full ThreatIntelligenceService + ThreatAnalysisEngine pipeline.
 *
 * Gemini ONLY explains the evidence. It does NOT determine risk.
 */
export function buildEnrichedAnalysisPrompt(ctx: EnrichedThreatContext): string {
  const signalList = ctx.ruleSignals
    .map((s) => `- ${s.label} (${s.severity}): ${s.description}`)
    .join("\n");

  const lines: string[] = [];

  if (ctx.lexical) {
    const lex = ctx.lexical;
    lines.push("## Lexical Analysis");
    if (lex.detectedBrands.length > 0)
      lines.push(`  Detected Brand(s): ${lex.detectedBrands.join(", ")}`);
    if (lex.detectedKeywords.length > 0)
      lines.push(`  Authentication Keywords: ${lex.detectedKeywords.slice(0, 5).join(", ")}`);
    if (lex.suspiciousTld)
      lines.push(`  Suspicious TLD: Yes`);
    if (lex.credentialHarvestingPattern)
      lines.push(`  Credential Harvesting Pattern: Detected`);
    if (lex.subdomainDeception)
      lines.push(`  Subdomain Deception: Detected`);
    if (lex.punycodeDetected)
      lines.push(`  Punycode (IDN Homograph): Detected`);
    if (lex.ipAddressUrl)
      lines.push(`  IP Address URL: Yes`);
    lines.push(`  Domain Entropy: ${lex.entropy}`);
    lines.push(`  Hyphens in Domain: ${lex.hyphenCount}`);
    lines.push(`  Lexical Risk Score: ${lex.score}/100`);
  }

  if (ctx.intel?.google) {
    const g = ctx.intel.google;
    lines.push("## Google Safe Browsing");
    if (g.error) {
      lines.push(`  Status: Unavailable (${g.error})`);
    } else {
      lines.push(`  Detected: ${g.detected}`);
      if (g.detected && g.threatTypes.length > 0)
        lines.push(`  Threat Types: ${g.threatTypes.join(", ")}`);
    }
  }

  if (ctx.intel?.virusTotal) {
    const vt = ctx.intel.virusTotal;
    lines.push("## VirusTotal");
    if (vt.error) {
      lines.push(`  Status: Unavailable (${vt.error})`);
    } else {
      lines.push(`  Malicious Vendors: ${vt.maliciousCount}`);
      lines.push(`  Suspicious Vendors: ${vt.suspiciousCount}`);
      lines.push(`  Community Score: ${vt.communityScore}`);
      if (vt.categories.length > 0)
        lines.push(`  Categories: ${vt.categories.slice(0, 5).join(", ")}`);
    }
  }

  if (ctx.intel?.rdap) {
    const r = ctx.intel.rdap;
    lines.push("## RDAP Domain");
    if (r.error) {
      lines.push(`  Status: Unavailable (${r.error})`);
    } else {
      lines.push(`  Domain: ${r.domain}`);
      lines.push(`  Age: ${r.ageInDays !== null ? `${r.ageInDays} days` : "Unknown"}`);
      lines.push(`  Registrar: ${r.registrar ?? "Unknown"}`);
      if (r.registrationDate)
        lines.push(`  Registered: ${r.registrationDate.split("T")[0]}`);
    }
  }

  const evidenceBlock = lines.length > 0
    ? `\n## THREAT EVIDENCE\n${lines.join("\n")}`
    : "";

  return `You are AEGIS, a cybersecurity AI assistant for CyberShield AI.

CRITICAL INSTRUCTIONS:
- You are NOT a phishing detector.
- You are NOT a malware detector.
- You are NOT a threat intelligence engine.
- The backend has already completed all threat analysis.
- The backend verdict is FINAL.
- You MUST NEVER override it.
- You MUST NEVER downgrade it.
- You MUST NEVER upgrade it.
- You MUST NEVER use words like "Safe", "Unsafe", "Low Risk", "Medium Risk", "High Risk", "Critical", "Likely Safe", "Probably Safe", "Probably Malicious" unless they exactly match the backend verdict.
- Your only responsibility is to explain WHY the backend reached this conclusion.
- Your explanation must always remain consistent with the supplied verdict.

## BACKEND THREAT REPORT
URL: "${ctx.content.slice(0, 300)}"
Risk Score: ${ctx.engineScore.score}/100
Severity: ${ctx.engineScore.level}
Final Verdict: ${ctx.engineScore.verdict || "UNKNOWN"}
Headline: ${ctx.engineScore.headline || "None"}
Confidence: ${Math.round(ctx.engineScore.confidence * 100)}%
Reasons:
${ctx.engineScore.reasons.length > 0 ? ctx.engineScore.reasons.map((r) => `- ${r}`).join("\n") : "- Rule-based signals only"}

## RULE ENGINE SIGNALS
${signalList || "None detected"}
${evidenceBlock}

Respond with ONLY this JSON (no markdown, no extra text):
{
  "citizenExplanation": "<2-3 sentences explaining WHY the backend concluded the verdict is ${ctx.engineScore.verdict || "UNKNOWN"}. Keep it simple, friendly, reassuring for an Indian citizen. Cite the specific reasons supplied above without contradicting the verdict.>",
  "policeSummary": "<2-3 sentences for Indian Cyber Police: classifying the threat under ${ctx.engineScore.verdict || "UNKNOWN"}, citing relevant IPC/IT Act sections based on the reasons, and technical investigation notes.>",
  "technicalExplanation": "<2-3 sentences for security analysts explaining the specific evidence (lexical, threat feeds, RDAP) that supports the backend verdict of ${ctx.engineScore.verdict || "UNKNOWN"}.>"
}`;
}

export function buildThreatExplanationPrompt(context: ThreatContext): string {
  return `You are AEGIS, CyberShield AI's threat analyst. Explain this ${context.scanType} threat to a citizen.

Risk: ${context.riskScore}/100 (${context.riskLevel})
Signals: ${context.signals.map((s) => s.label).join(", ")}
Content: "${context.content.slice(0, 400)}"

Provide:
1. explanation: Why this is dangerous (2 sentences, simple language)
2. threatSummary: One line summary
3. recommendedActions: 3-5 specific actions
4. technicalReasoning: For investigators
5. citizenAdvice: Reassuring, friendly advice
6. policeNotes: Intelligence notes for cyber police

Respond as JSON.`;
}
