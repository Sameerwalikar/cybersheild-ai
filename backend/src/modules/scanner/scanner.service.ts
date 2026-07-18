import { scannerRepository } from "./scanner.repository.js";
import { analyzeMessage, analyzeUrl, analyzeQr, analyzeUpi, analyzeVoice } from "./risk-engine.js";
import { persistIntelEnrichment } from "./scanner.enrichment.js";
import { aiService } from "../ai/index.js";
import { notificationService } from "../notifications/index.js";
import { graphService } from "../graph/index.js";
import { timelineService } from "../timeline/index.js";
import { dashboardService } from "../dashboard/dashboard.service.js";
import {
  threatIntelligenceService,
  threatAnalysisEngine,
} from "../../services/threat-intelligence/index.js";
import { lexicalAnalyzer } from "../../services/threat-intelligence/lexical/index.js";
import type { ScanType } from "@prisma/client";
import type { EnrichedThreatContext } from "../../services/threat-intelligence/types.js";
import type { LexicalResult } from "../../services/threat-intelligence/lexical/lexicalTypes.js";

interface ScanInput {
  userId: string;
  scanType: ScanType;
  content: string;
  metadata?: any;
}

export const scannerService = {
  async analyzeScan(input: ScanInput) {
    const startTime = Date.now();

    // ── Step 1: Rule engine — always runs, source of truth for non-URL types ──
    let ruleResult;
    switch (input.scanType) {
      case "MESSAGE": ruleResult = analyzeMessage(input.content); break;
      case "URL":     ruleResult = analyzeUrl(input.content);     break;
      case "QR":      ruleResult = await analyzeQr(input.content, input.metadata?.originalType || "text"); break;
      case "UPI":     ruleResult = await analyzeUpi(input.content, input.metadata);     break;
      case "VOICE":   ruleResult = analyzeVoice(input.content);   break;
      default:        ruleResult = analyzeMessage(input.content);
    }

    // ── Step 2: Lexical analysis (sync, zero external deps) ─────────────────
    const isUrlScan = input.scanType === "URL" ||
      (input.scanType === "QR" && input.content.startsWith("http"));

    let lexical: LexicalResult | null = null;
    if (isUrlScan) {
      lexical = lexicalAnalyzer.analyze(input.content);
    }

    // ── Step 3: External threat intelligence (URL / QR-URL, parallel I/O) ───
    let intel = null;
    if (isUrlScan && threatIntelligenceService.isApplicable(input.scanType)) {
      try {
        intel = await threatIntelligenceService.enrichUrl(input.content);
      } catch {
        // Never block the scan — intel is always optional
      }
    }

    // ── Step 4: Threat Analysis Engine — deterministic final risk score ───────
    const engineScore = threatAnalysisEngine.compute(ruleResult.riskScore, intel, lexical);

    // Use engine score for URL scans (enriched), rule score for everything else
    const finalScore = isUrlScan ? engineScore.score : ruleResult.riskScore;
    const finalLevel = isUrlScan ? engineScore.level  : ruleResult.riskLevel;

    const processingTime = Date.now() - startTime;

    // ── Step 4: Persist scan + analysis ──────────────────────────────────────
    const scan = await scannerRepository.createScan({
      userId:    input.userId,
      scanType:  input.scanType,
      content:   input.content,
      metadata:  input.metadata,
    });

    const analysis = await scannerRepository.createAnalysis({
      scanId:         scan.id,
      riskScore:      finalScore,
      riskLevel:      finalLevel as any,
      summary:        ruleResult.summary,
      recommendation: ruleResult.recommendation,
      confidence:     isUrlScan ? engineScore.confidence : ruleResult.confidence,
      processingTime,
      signals:        ruleResult.signals,
    });

    // ── Step 5: Non-blocking side effects ────────────────────────────────────
    notificationService
      .notifyScanComplete(input.userId, scan.id, finalLevel, finalScore, input.scanType)
      .catch(() => {});

    dashboardService.invalidateUser(input.userId);

    graphService.processScan(scan.id, input.content, finalLevel).catch(() => {});

    timelineService.publish({
      type:            "THREAT_SCAN",
      actorId:         input.userId,
      title:           `${input.scanType} scan completed`,
      description:     `Risk: ${finalScore}/100 (${finalLevel})`,
      severity:        finalScore >= 60 ? "critical" : finalScore >= 30 ? "warning" : "info",
      relatedAnalysis: analysis.id,
    }).catch(() => {});

    // Persist intel enrichment (RiskScore + SavedWebsite) for URL scans
    if (isUrlScan && intel) {
      persistIntelEnrichment(analysis.id, input.content, intel, engineScore).catch(() => {});
    }

    // ── Step 6: AI enrichment ─────────────────────────────────────────────────
    let aiResult: {
      citizenExplanation: string;
      policeSummary: string;
      technicalExplanation: string;
      explanation:   string;
      category:      string;
      citizenAdvice: string;
      recommendations: string[];
      aiSummary:     string;
    } | null = null;

    try {
      if (isUrlScan && intel) {
        // NEW path: enriched URL analysis — Gemini only explains evidence
        const enrichedCtx: EnrichedThreatContext = {
          scanType:    input.scanType.toLowerCase(),
          content:     input.content,
          ruleScore:   ruleResult.riskScore,
          ruleLevel:   ruleResult.riskLevel,
          ruleSignals: ruleResult.signals,
          lexical,
          intel,
          engineScore,
        };
        const enrichedAi = await aiService.analyzeEnrichedUrl(enrichedCtx);
        aiResult = {
          citizenExplanation:   enrichedAi.citizenExplanation,
          policeSummary:        enrichedAi.policeSummary,
          technicalExplanation: enrichedAi.technicalExplanation,
          explanation:          enrichedAi.citizenExplanation, // Map to explanation
          citizenAdvice:        enrichedAi.citizenExplanation, // Map to citizenAdvice
          category:             (engineScore.verdict || "unknown").toLowerCase().replace("likely_", ""),
          recommendations:      engineScore.recommendation ? [engineScore.recommendation] : [],
          aiSummary:            engineScore.headline || "Analysis complete",
        };
      } else {
        // EXISTING path: rule-engine-only context for non-URL scans
        const threatCtx = {
          scanType: input.scanType.toLowerCase() as any,
          content:  input.content,
          riskScore: ruleResult.riskScore,
          riskLevel: ruleResult.riskLevel,
          signals:   ruleResult.signals,
        };
        const [aiAnalysis, citizenAdvice] = await Promise.all([
          aiService.analyzeText(threatCtx),
          aiService.generateCitizenAdvice(threatCtx),
        ]);
        aiResult = {
          citizenExplanation:   aiAnalysis.explanation,
          policeSummary:        "",
          technicalExplanation: aiAnalysis.explanation,
          explanation:          aiAnalysis.explanation,
          category:             aiAnalysis.category,
          citizenAdvice,
          recommendations:      aiAnalysis.recommendations,
          aiSummary:            aiAnalysis.aiSummary,
        };
      }
    } catch {
      // AI failed — rule engine result is still complete and correct
      aiResult = null;
    }

    // ── Step 7: Build response ────────────────────────────────────────────────
    const intelSummary = buildIntelSummary(lexical, intel, engineScore, isUrlScan);

    let finalSummary = (isUrlScan 
      ? engineScore.headline 
      : (aiResult?.citizenExplanation || ruleResult.summary)) || "Scan complete";

    // Enforce threat consistency validation
    if (finalScore >= 80) {
      const forbidden = ["safe", "likely safe", "minor concerns", "low risk", "exercise caution"];
      const lowerSummary = finalSummary.toLowerCase();
      for (const word of forbidden) {
        if (lowerSummary.includes(word)) {
          finalSummary = (isUrlScan ? engineScore.headline : null) || "Critical threat detected.";
          break;
        }
      }
    } else if (finalScore <= 20) {
      const forbidden = ["malicious", "critical", "dangerous"];
      const lowerSummary = finalSummary.toLowerCase();
      for (const word of forbidden) {
        if (lowerSummary.includes(word)) {
          finalSummary = (isUrlScan ? engineScore.headline : null) || "No known threats detected.";
          break;
        }
      }
    }

    return {
      id:              analysis.id,
      scanId:          scan.id,
      scanType:        input.scanType.toLowerCase(),
      riskScore:       finalScore,
      riskLevel:       finalLevel.toLowerCase(),
      severity:        finalLevel.toLowerCase(),
      verdict:         isUrlScan ? engineScore.verdict : finalLevel.toLowerCase(),
      headline:        isUrlScan ? engineScore.headline : `Scan complete`,
      confidence:      isUrlScan ? engineScore.confidence : ruleResult.confidence,
      summary:         finalSummary,
      recommendation:  isUrlScan ? (engineScore.recommendation || ruleResult.recommendation) : ruleResult.recommendation,
      reasons:         isUrlScan ? engineScore.reasons : [],
      metadata:        ruleResult.metadata || null,
      citizenExplanation:   aiResult?.citizenExplanation || "",
      policeSummary:        aiResult?.policeSummary || "",
      technicalExplanation: aiResult?.technicalExplanation || "",
      signals:         ruleResult.signals.map((s) => ({
        label:       s.label,
        severity:    s.severity.toLowerCase(),
        confidence:  s.confidence,
        description: s.description,
      })),
      processingTime: Date.now() - startTime,
      timestamp:      scan.createdAt.toISOString(),
      // AI block — same shape as before, extended with new fields
      ai: aiResult ? {
        explanation:     aiResult.explanation,
        category:        aiResult.category,
        citizenAdvice:   aiResult.citizenAdvice,
        policeSummary:   aiResult.policeSummary || undefined,
        recommendations: aiResult.recommendations,
        aiSummary:       aiResult.aiSummary,
      } : null,
      // New: structured threat intel (only present for URL scans)
      intel: intelSummary,
    };
  },

  async getHistory(userId: string) {
    const scans = await scannerRepository.getUserScans(userId);
    return scans.map((scan) => ({
      id:        scan.analysis?.id || scan.id,
      scanType:  scan.scanType.toLowerCase(),
      content:   scan.content.slice(0, 100),
      riskScore: scan.analysis?.riskScore || 0,
      riskLevel: (scan.analysis?.riskLevel || "SAFE").toLowerCase(),
      timestamp: scan.createdAt.toISOString(),
      status:    scan.status.toLowerCase(),
    }));
  },

  async analyzeImageScan(input: {
    userId: string;
    imageBase64: string;
    mimeType: string;
    description?: string;
  }) {
    const startTime = Date.now();

    // Step 1: AI vision analysis (primary for images)
    let aiResult;
    try {
      aiResult = await aiService.analyzeImage(input.imageBase64, input.mimeType, input.description);
    } catch {
      aiResult = {
        riskScore:       50,
        confidence:      0.5,
        category:        "unknown",
        explanation:     "AI vision analysis unavailable. Image could not be fully analyzed.",
        detectedSignals: ["Analysis pending"],
        recommendations: ["Manually review the image content.", "Report if suspicious."],
        aiSummary:       "Image analysis incomplete — AI service unavailable.",
      };
    }

    const processingTime = Date.now() - startTime;
    const riskLevel =
      aiResult.riskScore >= 80 ? "CRITICAL" :
      aiResult.riskScore >= 60 ? "HIGH" :
      aiResult.riskScore >= 40 ? "MEDIUM" :
      aiResult.riskScore >= 20 ? "LOW" : "SAFE";

    const scan = await scannerRepository.createScan({
      userId:   input.userId,
      scanType: "QR",
      content:  `[IMAGE:${input.mimeType}] ${input.description || "Image scan"}`,
      metadata: { isImage: true, mimeType: input.mimeType },
    });

    const analysis = await scannerRepository.createAnalysis({
      scanId:         scan.id,
      riskScore:      aiResult.riskScore,
      riskLevel:      riskLevel as any,
      summary:        aiResult.explanation,
      recommendation: aiResult.recommendations.join(" "),
      confidence:     aiResult.confidence,
      processingTime,
      signals:        aiResult.detectedSignals.map((s) => ({
        label:       s,
        severity:    aiResult.riskScore >= 60 ? "HIGH" : "MEDIUM",
        confidence:  aiResult.confidence,
        description: s,
      })),
    });

    notificationService
      .notifyScanComplete(input.userId, scan.id, riskLevel, aiResult.riskScore, "IMAGE")
      .catch(() => {});
    graphService
      .processScan(scan.id, aiResult.explanation + " " + aiResult.detectedSignals.join(" "), riskLevel)
      .catch(() => {});
    timelineService.publish({
      type:            "THREAT_SCAN",
      actorId:         input.userId,
      title:           "Image scan completed",
      description:     `Risk: ${aiResult.riskScore}/100 (${riskLevel})`,
      severity:        aiResult.riskScore >= 60 ? "critical" : aiResult.riskScore >= 30 ? "warning" : "info",
      relatedAnalysis: analysis.id,
    }).catch(() => {});

    return {
      id:              analysis.id,
      scanId:          scan.id,
      scanType:        "image",
      riskScore:       aiResult.riskScore,
      riskLevel:       riskLevel.toLowerCase(),
      confidence:      aiResult.confidence,
      summary:         aiResult.explanation,
      recommendation:  aiResult.recommendations.join(" "),
      signals:         aiResult.detectedSignals.map((s) => ({
        label:       s,
        severity:    aiResult.riskScore >= 60 ? "high" : "medium",
        confidence:  aiResult.confidence,
        description: s,
      })),
      processingTime,
      timestamp:       scan.createdAt.toISOString(),
      ai: {
        explanation:     aiResult.explanation,
        category:        aiResult.category,
        citizenAdvice:   aiResult.aiSummary,
        recommendations: aiResult.recommendations,
        aiSummary:       aiResult.aiSummary,
      },
      intel: null,
    };
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a clean, frontend-safe intel summary.
 * Only includes data that actually exists — no raw API payloads.
 */
function buildIntelSummary(
  lexical: LexicalResult | null,
  intel: Awaited<ReturnType<typeof threatIntelligenceService.enrichUrl>> | null,
  engineScore: ReturnType<typeof threatAnalysisEngine.compute>,
  isUrlScan: boolean,
) {
  if (!isUrlScan) return null;

  return {
    // Lexical analysis (always present for URL scans)
    lexical: lexical ? {
      score:                      lexical.score,
      detectedBrands:             lexical.detectedBrands,
      detectedKeywords:           lexical.detectedKeywords,
      suspiciousTld:              lexical.suspiciousTld,
      entropy:                    lexical.entropy,
      hyphenCount:                lexical.hyphenCount,
      credentialHarvestingPattern: lexical.credentialHarvestingPattern,
      subdomainDeception:         lexical.subdomainDeception,
      punycodeDetected:           lexical.punycodeDetected,
      ipAddressUrl:               lexical.ipAddressUrl,
      reasons:                    lexical.reasons,
    } : null,

    // External providers
    google: intel?.google
      ? {
          detected:    intel.google.detected,
          threatTypes: intel.google.threatTypes,
          available:   !intel.google.error,
        }
      : null,
    virusTotal: intel?.virusTotal
      ? {
          maliciousCount:  intel.virusTotal.maliciousCount,
          suspiciousCount: intel.virusTotal.suspiciousCount,
          communityScore:  intel.virusTotal.communityScore,
          categories:      intel.virusTotal.categories.slice(0, 5),
          available:       !intel.virusTotal.error,
        }
      : null,
    rdap: intel?.rdap
      ? {
          domain:           intel.rdap.domain,
          registrar:        intel.rdap.registrar,
          ageInDays:        intel.rdap.ageInDays,
          registrationDate: intel.rdap.registrationDate,
          isNewDomain:      intel.rdap.isNewDomain,
          isVeryNewDomain:  intel.rdap.isVeryNewDomain,
          available:        !intel.rdap.error,
        }
      : null,
    engineReasons: engineScore.reasons,
  };
}
