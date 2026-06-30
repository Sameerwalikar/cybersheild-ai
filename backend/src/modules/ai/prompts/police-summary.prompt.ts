import type { ThreatContext } from "../types.js";

export function buildPoliceSummaryPrompt(context: ThreatContext): string {
  return `Generate a concise intelligence note for Indian Cyber Police.

Scan Type: ${context.scanType}
Risk: ${context.riskScore}/100 (${context.riskLevel})
Signals: ${context.signals.map((s) => `${s.label} (${s.severity})`).join(", ")}
Content: "${context.content.slice(0, 500)}"

Include:
- Threat classification
- Applicable IPC/IT Act sections
- Recommended investigation steps
- Cross-reference suggestions

Keep it under 100 words. Professional tone.`;
}
