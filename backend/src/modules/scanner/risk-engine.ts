export interface Signal {
  label: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  description: string;
}

export interface AnalysisResult {
  riskScore: number;
  riskLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  signals: Signal[];
  summary: string;
  recommendation: string;
  processingTime?: number;
  metadata?: any;
}

import { analyzeUpiDetailed } from "../../services/threat-intelligence/upi/upiThreatEngine.js";

// ─── MESSAGE ANALYSIS ─────────────────────────────────────────────────

const urgencyPatterns = /\b(immediately|urgent|suspended|blocked|verify now|act now|expire|last chance|within \d+ hour)/i;
const bankPatterns = /\b(SBI|HDFC|ICICI|axis|kotak|RBI|bank|account|credit|debit)\b/i;
const otpPatterns = /\b(OTP|PIN|password|CVV|credential|verify)\b/i;
const linkPatterns = /(https?:\/\/[^\s]+)/gi;
const shortUrlPatterns = /\b(bit\.ly|tinyurl|goo\.gl|t\.co|is\.gd|rb\.gy)\b/i;

export function analyzeMessage(content: string): AnalysisResult {
  const signals: Signal[] = [];
  let score = 0;

  if (urgencyPatterns.test(content)) {
    signals.push({ label: "Urgency Language", severity: "HIGH", confidence: 0.92, description: "Message uses pressure tactics to force immediate action." });
    score += 25;
  }
  if (bankPatterns.test(content)) {
    signals.push({ label: "Bank Impersonation", severity: "HIGH", confidence: 0.88, description: "Message references banking institutions — possible brand impersonation." });
    score += 20;
  }
  if (otpPatterns.test(content)) {
    signals.push({ label: "Credential Request", severity: "CRITICAL", confidence: 0.95, description: "Message requests sensitive credentials. Legitimate services never ask for OTP/PIN via message." });
    score += 30;
  }
  if (linkPatterns.test(content)) {
    const links = content.match(linkPatterns) || [];
    const suspicious = links.some((l) => !l.includes("gov.in") && !l.includes("sbi.co.in") && !l.includes("amazon"));
    if (suspicious) {
      signals.push({ label: "Suspicious URL", severity: "HIGH", confidence: 0.85, description: "Message contains links to unverified domains." });
      score += 20;
    }
  }
  if (shortUrlPatterns.test(content)) {
    signals.push({ label: "Shortened URL", severity: "MEDIUM", confidence: 0.78, description: "Shortened URLs hide the actual destination." });
    score += 15;
  }

  if (signals.length === 0) {
    signals.push({ label: "No Threats", severity: "LOW", confidence: 0.9, description: "No known threat patterns detected." });
  }

  return buildResult(score, signals, "message");
}

// ─── URL ANALYSIS ─────────────────────────────────────────────────────

const suspiciousTlds = /\.(xyz|top|club|work|click|tk|ml|ga|cf|gq|info|pw)$/i;
const ipPattern = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
const lookalike = /(paypal|google|facebook|apple|microsoft|amazon|sbi|hdfc|icici|axis).*\.(xyz|top|club|work|info)/i;

export function analyzeUrl(url: string): AnalysisResult {
  const signals: Signal[] = [];
  let score = 0;

  if (suspiciousTlds.test(url)) {
    signals.push({ label: "Suspicious TLD", severity: "HIGH", confidence: 0.87, description: "Domain uses a top-level domain commonly associated with fraud." });
    score += 25;
  }
  if (ipPattern.test(url)) {
    signals.push({ label: "IP-Based URL", severity: "HIGH", confidence: 0.91, description: "URL uses raw IP address instead of domain — often used to bypass filters." });
    score += 30;
  }
  if (lookalike.test(url)) {
    signals.push({ label: "Brand Impersonation", severity: "CRITICAL", confidence: 0.94, description: "Domain mimics a legitimate brand on a suspicious TLD." });
    score += 35;
  }
  if (shortUrlPatterns.test(url)) {
    signals.push({ label: "URL Shortener", severity: "MEDIUM", confidence: 0.75, description: "Shortened URL hides actual destination." });
    score += 15;
  }
  if (url.length > 100) {
    signals.push({ label: "Excessive URL Length", severity: "LOW", confidence: 0.65, description: "Very long URLs can be used to hide malicious parameters." });
    score += 8;
  }

  if (signals.length === 0) {
    signals.push({ label: "URL Appears Safe", severity: "LOW", confidence: 0.88, description: "No known threat patterns detected in this URL." });
  }

  return buildResult(score, signals, "url");
}

// ─── QR ANALYSIS ──────────────────────────────────────────────────────

export async function analyzeQr(content: string, type: string): Promise<AnalysisResult> {
  if (type === "url") return analyzeUrl(content);
  if (type === "upi") return await analyzeUpi(content);

  const signals: Signal[] = [];
  let score = 0;

  if (content.includes("http")) {
    const urlResult = analyzeUrl(content);
    return { ...urlResult, summary: "QR code contains a URL. " + urlResult.summary };
  }

  signals.push({ label: "Text Content", severity: "LOW", confidence: 0.9, description: "QR code contains plain text with no detected threats." });
  return buildResult(score, signals, "qr");
}

// ─── UPI ANALYSIS ─────────────────────────────────────────────────────

export async function analyzeUpi(upiId: string, metadata?: any): Promise<AnalysisResult> {
  return await analyzeUpiDetailed(upiId, metadata);
}

// ─── VOICE ANALYSIS ───────────────────────────────────────────────────

const voiceUrgency = /\b(immediately|right now|don't hang up|transfer|arrest|warrant|suspend)\b/i;
const voiceAuthority = /\b(police|CBI|RBI|government|official|officer|inspector|department)\b/i;
const voiceFinancial = /\b(transfer|send|pay|UPI|account number|NEFT|RTGS|wallet)\b/i;

export function analyzeVoice(transcript: string): AnalysisResult {
  const signals: Signal[] = [];
  let score = 0;

  if (voiceUrgency.test(transcript)) {
    signals.push({ label: "Urgency Tactics", severity: "HIGH", confidence: 0.89, description: "Speaker uses pressure language to prevent rational thinking." });
    score += 25;
  }
  if (voiceAuthority.test(transcript)) {
    signals.push({ label: "Authority Impersonation", severity: "CRITICAL", confidence: 0.92, description: "Speaker claims to be from law enforcement or government — common vishing tactic." });
    score += 30;
  }
  if (voiceFinancial.test(transcript)) {
    signals.push({ label: "Financial Request", severity: "HIGH", confidence: 0.87, description: "Speaker requests financial action or payment details." });
    score += 25;
  }

  if (signals.length === 0) {
    signals.push({ label: "No Vishing Detected", severity: "LOW", confidence: 0.85, description: "No social engineering patterns detected in the transcript." });
  }

  return buildResult(score, signals, "voice");
}

// ─── HELPERS ──────────────────────────────────────────────────────────

function buildResult(score: number, signals: Signal[], type: string): AnalysisResult {
  score = Math.min(score, 100);
  const confidence = signals.length > 0
    ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
    : 0.5;

  const riskLevel = score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 40 ? "MEDIUM" : score >= 20 ? "LOW" : "SAFE";

  const summaries: Record<string, Record<string, string>> = {
    message: {
      SAFE: "This message appears safe. No threat indicators detected.",
      LOW: "Minor concerns detected but likely safe.",
      MEDIUM: "Some suspicious patterns found. Exercise caution.",
      HIGH: "Multiple threat indicators detected. This is likely a scam.",
      CRITICAL: "High-confidence phishing attempt. Do not interact with this message.",
    },
    url: {
      SAFE: "This URL appears legitimate and safe to visit.",
      LOW: "URL has minor concerns but is likely safe.",
      MEDIUM: "URL has suspicious characteristics. Verify before visiting.",
      HIGH: "This URL shows strong signs of being malicious. Do not visit.",
      CRITICAL: "This URL is highly likely to be a phishing or malware page.",
    },
    qr: {
      SAFE: "QR code content appears safe.",
      LOW: "Minor concerns with QR content.",
      MEDIUM: "QR content has suspicious elements.",
      HIGH: "QR code may lead to malicious content.",
      CRITICAL: "QR code is highly suspicious — do not proceed.",
    },
    upi: {
      SAFE: "This UPI ID appears legitimate.",
      LOW: "Minor concerns but likely safe for small transactions.",
      MEDIUM: "Some suspicious patterns. Verify before sending money.",
      HIGH: "This UPI ID has fraud indicators. Do not transact.",
      CRITICAL: "This UPI ID is highly likely to be fraudulent.",
    },
    voice: {
      SAFE: "No social engineering patterns detected.",
      LOW: "Minor concerns in conversation.",
      MEDIUM: "Some manipulation tactics detected. Be cautious.",
      HIGH: "Strong vishing indicators. This is likely a scam call.",
      CRITICAL: "Critical social engineering attack detected. Hang up immediately.",
    },
  };

  const recommendations: Record<string, string> = {
    SAFE: "No action needed. Content appears safe.",
    LOW: "Stay vigilant. No immediate action required.",
    MEDIUM: "Verify through official channels before proceeding.",
    HIGH: "Do not interact. Block and report this content.",
    CRITICAL: "Block immediately. Report to authorities. Do not share any information.",
  };

  return {
    riskScore: score,
    riskLevel,
    confidence: Math.round(confidence * 100) / 100,
    signals,
    summary: summaries[type]?.[riskLevel] || "Analysis complete.",
    recommendation: recommendations[riskLevel],
  };
}
