import { upiReputationRepository } from "../../../modules/scanner/upiReputation.repository.js";
import { prisma } from "../../../config/database.js";
import type { AnalysisResult, Signal } from "../../../modules/scanner/risk-engine.js";

const BRAND_KEYWORDS = [
  "paytm", "phonepe", "googlepay", "gpay", "amazonpay", "npci", "upi", "sbi", "icici", "hdfc", "axis", "kotak", "rbi", "gov", "government"
];

const SCAM_KEYWORDS = [
  "refund", "claim", "reward", "cashback", "gift", "lottery", "winner", "otp", "verify", "support", "official", "secure", "help", "payment", "kyc", "unlock", "bonus", "offer", "loan", "customercare"
];

/**
 * Detailed UPI Threat Engine with Brand Impersonation, Scam Keywords,
 * Reputation Database, and Scammer Profile checks.
 */
export async function analyzeUpiDetailed(upiId: string, metadata?: any): Promise<AnalysisResult> {
  const signals: Signal[] = [];
  let score = 0;

  // 1. Normalization
  const cleaned = upiId.trim().toLowerCase();

  // 2. Structural Validation
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
  if (!upiRegex.test(cleaned)) {
    signals.push({
      label: "Invalid Format",
      severity: "CRITICAL",
      confidence: 0.99,
      description: "UPI ID does not follow standard structural format (e.g. name@bank)."
    });
    return {
      riskScore: 100,
      riskLevel: "CRITICAL",
      confidence: 0.99,
      summary: "Invalid UPI format matched.",
      recommendation: "Do NOT transact with this identifier.",
      signals,
      processingTime: 0
    };
  }

  const handle = cleaned.split("@")[0] || "";
  const provider = cleaned.split("@")[1] || "";

  // 3. Brand Impersonation
  let isImpersonating = false;
  let matchedBrand = "";
  for (const brand of BRAND_KEYWORDS) {
    if (handle.includes(brand)) {
      isImpersonating = true;
      matchedBrand = brand.toUpperCase();
      break;
    }
  }

  const isOfficialBrandHandle = ["paytm", "phonepe", "googlepay", "gpay", "amazonpay", "npci", "upi", "sbi", "icici", "hdfc", "axis", "kotak", "rbi"].includes(handle);
  
  if (isImpersonating && !isOfficialBrandHandle) {
    signals.push({
      label: "Brand Impersonation",
      severity: "HIGH",
      confidence: 0.88,
      description: `Potential brand impersonation detected for ${matchedBrand}.`
    });
    score += 45;
  }

  // 4. Fraud Pattern Detection
  const detectedScamKeywords: string[] = [];
  for (const kw of SCAM_KEYWORDS) {
    if (handle.includes(kw)) {
      detectedScamKeywords.push(kw);
    }
  }

  if (detectedScamKeywords.length > 0) {
    signals.push({
      label: "Fraud Pattern Detection",
      severity: "HIGH",
      confidence: 0.9,
      description: `Handle contains keywords associated with scams: ${detectedScamKeywords.join(", ")}.`
    });
    score += Math.min(detectedScamKeywords.length * 20, 50);
  }

  // Suspicious handle naming check (e.g. claim, refund, security, official)
  const highRiskScamHandles = ["refund", "claim", "verify", "support", "help", "security", "official", "care"];
  let hasHighRiskHandle = false;
  for (const hr of highRiskScamHandles) {
    if (handle.includes(hr)) {
      hasHighRiskHandle = true;
      break;
    }
  }
  if (hasHighRiskHandle) {
    signals.push({
      label: "Suspicious Handle",
      severity: "HIGH",
      confidence: 0.85,
      description: "UPI handle structure resembles a scam/support account pattern."
    });
    score += 25;
  }

  // Length check
  if (handle.length > 20) {
    signals.push({
      label: "Unusual Length",
      severity: "LOW",
      confidence: 0.6,
      description: "Unusually long UPI handle structure."
    });
    score += 8;
  }

  // Uncommon provider check
  if (!["ybl", "paytm", "okhdfcbank", "okaxis", "oksbi", "ibl", "apl", "upi"].includes(provider)) {
    signals.push({
      label: "Uncommon Provider",
      severity: "MEDIUM",
      confidence: 0.7,
      description: `UPI provider "${provider}" is less common — verify before transacting.`
    });
    score += 12;
  }

  // 5. Internal Reputation Database Lookups
  const isQrScan = !!(metadata?.isQrScan || metadata?.originalQr);
  const reputation = isQrScan ? null : await upiReputationRepository.getReputation(cleaned);
  if (reputation) {
    score += Math.min(reputation.reportCount * 15, 40);
    signals.push({
      label: "Previously Reported",
      severity: reputation.riskScore >= 80 ? "CRITICAL" : reputation.riskScore >= 60 ? "HIGH" : "MEDIUM",
      confidence: 0.95,
      description: `This UPI has been previously reported ${reputation.reportCount} time(s). First seen: ${reputation.firstSeen.toDateString()}.`
    });
  }

  // 6. Scammer Profile Integration
  const scammerProfile = await prisma.scammerProfile.findFirst({
    where: {
      upiIds: {
        has: cleaned
      }
    }
  });

  if (scammerProfile) {
    score = Math.max(score, scammerProfile.threatLevel === "CRITICAL" ? 95 : scammerProfile.threatLevel === "HIGH" ? 85 : 60);
    signals.push({
      label: "Known Scammer",
      severity: scammerProfile.threatLevel === "CRITICAL" ? "CRITICAL" : "HIGH",
      confidence: 0.99,
      description: `This UPI is linked to a known scammer profile with ${scammerProfile.totalReports} occurrences.`
    });
  }

  // 7. Threat Fusion & Verdict
  score = Math.min(100, score);
  const confidence = signals.length > 0
    ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
    : 0.5;

  const riskLevel = score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 40 ? "MEDIUM" : score >= 20 ? "LOW" : "SAFE";

  const recommendations: Record<string, string> = {
    SAFE: "This website appears safe based on current intelligence.",
    LOW: "Proceed with caution. Avoid entering sensitive details unless verified.",
    MEDIUM: "Exercise extreme caution. Verify the sender and domain address.",
    HIGH: "Do NOT enter your passwords, OTPs, or personal details.",
    CRITICAL: "Do NOT visit or execute any downloaded files."
  };

  const finalRecommendation = recommendations[riskLevel] || recommendations.MEDIUM;

  const summaries: Record<string, string> = {
    SAFE: "No fraud indicators detected for this UPI ID.",
    LOW: "UPI has minor concerns but is likely safe.",
    MEDIUM: "Suspicious UPI handle patterns detected.",
    HIGH: "Highly suspicious UPI ID with fraud patterns.",
    CRITICAL: "Critical threat: Linked to verified scammer profiles."
  };

  const finalSummary = summaries[riskLevel] || summaries.MEDIUM;

  const scanMetadata: any = {};
  if (reputation) {
    scanMetadata.reputation = {
      reportCount: reputation.reportCount,
      firstSeen: reputation.firstSeen.toISOString(),
      lastSeen: reputation.lastSeen.toISOString(),
      status: reputation.status,
    };
  }
  if (scammerProfile) {
    scanMetadata.scammerProfile = {
      occurrences: scammerProfile.occurrences,
      totalReports: scammerProfile.totalReports,
      threatNetwork: scammerProfile.graphNodeIds,
    };
  }

  return {
    riskScore: score,
    riskLevel,
    confidence,
    summary: finalSummary,
    recommendation: finalRecommendation,
    signals,
    processingTime: 0,
    metadata: scanMetadata
  };
}
