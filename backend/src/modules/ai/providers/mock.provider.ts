import type { AIProvider, ThreatContext } from "../types.js";

export class MockProvider implements AIProvider {
  async analyzeText(prompt: string, _systemPrompt?: string): Promise<string> {
    // Return deterministic mock JSON based on prompt content
    if (prompt.includes("citizenExplanation")) {
      let verdict = "SAFE";
      if (prompt.includes("Verdict: LIKELY_MALWARE") || prompt.includes("Verdict: CRITICAL")) {
        verdict = "LIKELY_MALWARE";
      } else if (prompt.includes("Verdict: LIKELY_PHISHING") || prompt.includes("Verdict: MALICIOUS")) {
        verdict = "LIKELY_PHISHING";
      } else if (prompt.includes("Verdict: LOW_RISK")) {
        verdict = "LOW_RISK";
      }

      if (verdict === "LIKELY_MALWARE") {
        return JSON.stringify({
          citizenExplanation: "Warning: This URL contains a malicious file download. Do not open or run any files from this site.",
          policeSummary: "Malware distribution page. File downloads detected. Section 66F IT Act.",
          technicalExplanation: "Executable payload detection with recent domain registry matched malware delivery pattern."
        });
      } else if (verdict === "LIKELY_PHISHING") {
        return JSON.stringify({
          citizenExplanation: "Caution: This URL mimics a popular brand to steal your banking details. Do not enter passwords or OTPs.",
          policeSummary: "Credential harvesting page targeting banking customers. Section 66D IT Act, IPC 420.",
          technicalExplanation: "Brand impersonation and credential harvesting keywords detected in lexical analysis."
        });
      } else if (verdict === "LOW_RISK") {
        return JSON.stringify({
          citizenExplanation: "Proceed with caution. Minor concerns were detected on this page.",
          policeSummary: "Low priority scan with minor risk factors. No immediate action required.",
          technicalExplanation: "Unregistered domain or minor entropy alerts flagged during scan."
        });
      } else {
        return JSON.stringify({
          citizenExplanation: "This website appears safe based on current reputation and threat intelligence.",
          policeSummary: "Clean scan. No threats detected.",
          technicalExplanation: "No threat indicators, safe domain checks matched."
        });
      }
    }

    if (prompt.includes("riskScore")) {
      return JSON.stringify({
        riskScore: 75,
        confidence: 0.88,
        category: "phishing",
        explanation: "This content contains patterns commonly associated with phishing attempts targeting Indian banking customers.",
        detectedSignals: ["Urgency language", "Brand impersonation", "Suspicious link"],
        recommendations: ["Do not click any links", "Block the sender", "Report to cybercrime.gov.in"],
        aiSummary: "Likely phishing attempt impersonating a banking institution.",
      });
    }
    if (prompt.includes("citizen")) {
      return "You're safe! You did the right thing by checking this. Don't click any links or share personal information. If you're unsure, verify directly through your bank's official app.";
    }
    if (prompt.includes("Police") || prompt.includes("police")) {
      return "Medium-High priority. Indicators: brand impersonation, urgency tactics. Recommend cross-referencing with known phishing clusters. Applicable: IT Act 66D, IPC 420.";
    }
    if (prompt.includes("Extract") || prompt.includes("extract")) {
      return JSON.stringify(["suspicious-link.xyz", "+91 98XXX XXXXX", "fraud@upi"]);
    }
    if (prompt.includes("Summarize") || prompt.includes("summarize")) {
      return "Suspected phishing message with urgency language and impersonation.";
    }
    return "Mock AI analysis complete.";
  }

  async analyzeImage(_imageBase64: string, _mimeType: string, _prompt: string): Promise<string> {
    return JSON.stringify({
      riskScore: 68,
      confidence: 0.82,
      category: "impersonation",
      explanation: "This image appears to show a fake banking interface designed to steal credentials. The layout mimics a legitimate bank but uses incorrect branding elements.",
      detectedSignals: ["Fake login form", "Incorrect bank logo", "Suspicious URL in address bar"],
      recommendations: ["Do not enter credentials", "Report to your bank", "Take a screenshot for evidence"],
      aiSummary: "Fake banking page screenshot — likely credential harvesting.",
    });
  }

  async generateCitizenAdvice(context: ThreatContext): Promise<string> {
    const level = context.riskLevel.toLowerCase();
    const advice: Record<string, string> = {
      safe: "You're safe! This content doesn't show any signs of being harmful.",
      low: "This looks mostly fine, but stay alert. Trust your instincts.",
      medium: "We found some concerns. Don't click links or share details until you verify through official channels.",
      high: "This is very likely a scam. Don't respond or click anything. Block the sender.",
      critical: "This is almost certainly fraud. Block immediately. If you shared any details, contact your bank right away.",
    };
    return advice[level] || advice.medium;
  }

  async generatePoliceSummary(context: ThreatContext): Promise<string> {
    if (context.riskScore < 40) return "Low priority. No actionable intelligence.";
    return `${context.riskLevel} priority. ${context.signals.length} indicators detected. Recommend cross-referencing with fraud clusters. Applicable: IT Act 66C/66D, IPC 420.`;
  }

  async extractThreatSignals(content: string): Promise<string[]> {
    const signals: string[] = [];
    if (content.match(/https?:\/\//)) signals.push("Suspicious URL");
    if (content.match(/[a-zA-Z0-9._-]+@[a-zA-Z]+/)) signals.push("UPI/Email address");
    if (content.match(/\+?\d[\d\s-]{8,}/)) signals.push("Phone number");
    if (content.match(/\b(OTP|PIN|password)\b/i)) signals.push("Credential request");
    return signals.length > 0 ? signals : ["No entities detected"];
  }

  async summarizeThreat(context: ThreatContext): Promise<string> {
    if (context.riskScore < 20) return "Content appears safe.";
    if (context.riskScore < 50) return `Minor concerns in ${context.scanType} scan.`;
    return `${context.riskLevel} risk: ${context.signals[0]?.label || "suspicious content"} detected.`;
  }
}
