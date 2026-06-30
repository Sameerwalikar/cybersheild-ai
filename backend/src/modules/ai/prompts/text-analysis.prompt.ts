import type { ThreatContext } from "../types.js";

export function buildTextAnalysisPrompt(context: ThreatContext): string {
  const signalList = context.signals.map((s) => `- ${s.label} (${s.severity}, ${Math.round(s.confidence * 100)}%): ${s.description}`).join("\n");

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

Use Indian context. Be precise. Do not minimize real threats.`;
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
