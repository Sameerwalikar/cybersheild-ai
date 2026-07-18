// ─── VERDICT GENERATOR ────────────────────────────────────────────────────────

export interface VerdictDetails {
  verdict: "SAFE" | "LOW_RISK" | "SUSPICIOUS" | "LIKELY_PHISHING" | "LIKELY_MALWARE" | "MALICIOUS" | "CRITICAL";
  headline: string;
  subtitle: string;
  recommendation: string;
}

/**
 * Maps a threat score and detection reasons to a standardized verdict and actionable alerts.
 */
export function generateVerdict(score: number, reasons: string[]): VerdictDetails {
  let verdict: VerdictDetails["verdict"] = "SAFE";
  let headline = "No Known Threats Detected";
  let subtitle = "No threat indicators detected";
  let recommendation = "This website appears safe based on current intelligence.";

  const reasonsText = reasons.join(" ").toLowerCase();
  
  const isMalwareThreat = reasonsText.includes("malware") || 
                          reasonsText.includes("executable") || 
                          reasonsText.includes("script") ||
                          reasonsText.includes("powershell") ||
                          reasonsText.includes("double extension");

  const isPhishingThreat = reasonsText.includes("brand impersonation") || 
                           reasonsText.includes("phishing") || 
                           reasonsText.includes("credential") ||
                           reasonsText.includes("subdomain deception") ||
                           reasonsText.includes("safe browsing");

  if (score >= 90) {
    if (isMalwareThreat) {
      verdict = "CRITICAL";
      headline = "Critical Threat Detected";
      subtitle = "This URL is delivering malicious software";
      recommendation = "Do NOT visit or execute any downloaded files.";
    } else if (isPhishingThreat) {
      verdict = "LIKELY_PHISHING";
      headline = "Potential Credential Harvesting Website";
      subtitle = "Our reputation engine flagged this URL as a phishing attempt";
      recommendation = "Do NOT enter your passwords, OTPs, or personal details.";
      
      if (reasonsText.includes("safe browsing") || reasonsText.includes("virustotal")) {
        verdict = "CRITICAL";
        headline = "Critical Threat Detected";
        subtitle = "Verified threat intelligence reports this URL is malicious";
        recommendation = "Do NOT visit or execute any downloaded files.";
      }
    } else {
      verdict = "CRITICAL";
      headline = "Critical Threat Detected";
      subtitle = "This URL is highly dangerous and poses severe risk";
      recommendation = "Do NOT visit or execute any downloaded files.";
    }
  } else if (score >= 60) {
    if (isMalwareThreat) {
      verdict = "LIKELY_MALWARE";
      headline = "Potential Malware Distribution Detected";
      subtitle = "Our reputation engine flagged this URL as highly suspicious";
      recommendation = "Do NOT visit or execute any downloaded files.";
    } else if (isPhishingThreat) {
      verdict = "LIKELY_PHISHING";
      headline = "Potential Credential Harvesting Website";
      subtitle = "Our reputation engine flagged this URL as a phishing attempt";
      recommendation = "Do NOT enter your passwords, OTPs, or personal details.";
    } else {
      verdict = "SUSPICIOUS";
      headline = "Potentially Suspicious Website";
      subtitle = "Suspicious activity detected";
      recommendation = "Exercise extreme caution. Verify the sender and domain address.";
    }
  } else if (score >= 40) {
    verdict = "SUSPICIOUS";
    headline = "Potentially Suspicious Website";
    subtitle = "This URL exhibits patterns commonly associated with cyber threats";
    recommendation = "Exercise extreme caution. Verify the sender and domain address.";
  } else if (score >= 20) {
    verdict = "LOW_RISK";
    headline = "Exercise Caution";
    subtitle = "Minor concerns detected, but likely safe";
    recommendation = "Proceed with caution. Avoid entering sensitive details unless verified.";
  }

  return { verdict, headline, subtitle, recommendation };
}
