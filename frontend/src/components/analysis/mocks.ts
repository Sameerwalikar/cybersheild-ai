export interface AnalysisResult {
  id: string;
  scanType: "message" | "url" | "qr" | "upi" | "voice";
  riskScore: number;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  timestamp: string;
  processingTime: number;
  summary: string;
  threats: ThreatIndicator[];
  evidence: EvidenceItem[];
  recommendations: Recommendation[];
  relatedThreats: RelatedThreat[];
  confidence: ConfidenceData;
  timeline: TimelineStep[];
}

export interface ThreatIndicator {
  id: string;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  description: string;
}

export interface EvidenceItem {
  id: string;
  text: string;
  highlight: string;
  category: string;
}

export interface Recommendation {
  id: string;
  action: string;
  priority: "high" | "medium" | "low";
  impact: string;
}

export interface RelatedThreat {
  id: string;
  description: string;
  count: number;
}

export interface ConfidenceData {
  score: number;
  reasons: string[];
}

export interface TimelineStep {
  id: string;
  label: string;
  status: "completed" | "active" | "pending";
  duration?: number;
}

export const mockAnalysis: AnalysisResult = {
  id: "ANL-2026-00847",
  scanType: "message",
  riskScore: 94,
  riskLevel: "critical",
  timestamp: "2026-06-30T14:23:00Z",
  processingTime: 2340,
  summary: "This message impersonates a banking institution and requests immediate payment through an unofficial UPI ID. Several phishing indicators were detected including urgency language, brand impersonation, and a known malicious domain pattern.",
  threats: [
    { id: "t1", label: "Urgent Language", severity: "high", confidence: 0.96, description: "Message creates artificial urgency to bypass rational decision-making." },
    { id: "t2", label: "Unknown Domain", severity: "critical", confidence: 0.99, description: "The domain sbi-secure-login.xyz was registered 2 days ago and is not affiliated with SBI." },
    { id: "t3", label: "Suspicious UPI", severity: "high", confidence: 0.91, description: "The UPI ID does not match any official bank payment address." },
    { id: "t4", label: "OTP Request", severity: "critical", confidence: 0.98, description: "Legitimate institutions never request OTP over SMS or messaging." },
    { id: "t5", label: "Financial Pressure", severity: "medium", confidence: 0.87, description: "Threatening account suspension to force immediate action." },
    { id: "t6", label: "Brand Impersonation", severity: "high", confidence: 0.94, description: "Message falsely claims to be from State Bank of India." },
  ],
  evidence: [
    { id: "e1", text: "Your account will be blocked within 24 hours", highlight: "Urgency", category: "Language pattern" },
    { id: "e2", text: "sbi-secure-login.xyz", highlight: "Fake Domain", category: "URL analysis" },
    { id: "e3", text: "verify@sbi-secure.pay", highlight: "Unknown UPI", category: "Payment fraud" },
    { id: "e4", text: "Enter your OTP to verify identity", highlight: "OTP Phishing", category: "Credential theft" },
  ],
  recommendations: [
    { id: "r1", action: "Do not click any links in this message.", priority: "high", impact: "Prevents credential theft and malware installation." },
    { id: "r2", action: "Block the sender immediately.", priority: "high", impact: "Prevents further contact attempts from this number." },
    { id: "r3", action: "Report this message to your carrier.", priority: "medium", impact: "Helps block the sender for other potential victims." },
    { id: "r4", action: "Verify account status through the official SBI app.", priority: "medium", impact: "Confirms your account is safe without risking credentials." },
    { id: "r5", action: "Never share OTP, PIN, or password with anyone.", priority: "low", impact: "General security hygiene reminder." },
  ],
  relatedThreats: [
    { id: "rt1", description: "132 users reported similar messages this week.", count: 132 },
    { id: "rt2", description: "Domain linked to 3 active fraud clusters.", count: 3 },
    { id: "rt3", description: "This UPI ID appeared in 48 previous reports.", count: 48 },
  ],
  confidence: {
    score: 94,
    reasons: [
      "Known phishing language patterns detected.",
      "Domain registered within last 72 hours.",
      "UPI ID matches previously reported fraud.",
      "48 community reports corroborate this threat.",
    ],
  },
  timeline: [
    { id: "s1", label: "Input Received", status: "completed", duration: 120 },
    { id: "s2", label: "Preprocessing", status: "completed", duration: 340 },
    { id: "s3", label: "Threat Detection", status: "completed", duration: 890 },
    { id: "s4", label: "Risk Scoring", status: "completed", duration: 450 },
    { id: "s5", label: "Recommendations", status: "completed", duration: 380 },
    { id: "s6", label: "Report Generated", status: "completed", duration: 160 },
  ],
};
