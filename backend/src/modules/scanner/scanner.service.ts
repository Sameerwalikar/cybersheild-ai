import { scannerRepository } from "./scanner.repository.js";
import { analyzeMessage, analyzeUrl, analyzeQr, analyzeUpi, analyzeVoice } from "./risk-engine.js";
import { aiService } from "../ai/index.js";
import { notificationService } from "../notifications/index.js";
import { graphService } from "../graph/index.js";
import { timelineService } from "../timeline/index.js";
import type { ScanType } from "@prisma/client";

interface ScanInput {
  userId: string;
  scanType: ScanType;
  content: string;
  metadata?: any;
}

export const scannerService = {
  async analyzeScan(input: ScanInput) {
    const startTime = Date.now();

    // Step 1: Rule engine calculates risk score (source of truth)
    let result;
    switch (input.scanType) {
      case "MESSAGE": result = analyzeMessage(input.content); break;
      case "URL": result = analyzeUrl(input.content); break;
      case "QR": result = analyzeQr(input.content, input.metadata?.originalType || "text"); break;
      case "UPI": result = analyzeUpi(input.content); break;
      case "VOICE": result = analyzeVoice(input.content); break;
      default: result = analyzeMessage(input.content);
    }

    const processingTime = Date.now() - startTime;

    // Step 2: Persist scan + analysis
    const scan = await scannerRepository.createScan({
      userId: input.userId,
      scanType: input.scanType,
      content: input.content,
      metadata: input.metadata,
    });

    const analysis = await scannerRepository.createAnalysis({
      scanId: scan.id,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel as any,
      summary: result.summary,
      recommendation: result.recommendation,
      confidence: result.confidence,
      processingTime,
      signals: result.signals,
    });

    // Step 3: Create notification (non-blocking)
    notificationService.notifyScanComplete(input.userId, scan.id, result.riskLevel, result.riskScore, input.scanType).catch(() => {});

    // Step 3b: Graph intelligence (non-blocking)
    graphService.processScan(scan.id, input.content, result.riskLevel).catch(() => {});

    // Step 3c: Timeline event (non-blocking)
    timelineService.publish({
      type: "THREAT_SCAN",
      actorId: input.userId,
      title: `${input.scanType} scan completed`,
      description: `Risk: ${result.riskScore}/100 (${result.riskLevel})`,
      severity: result.riskScore >= 60 ? "critical" : result.riskScore >= 30 ? "warning" : "info",
      relatedAnalysis: analysis.id,
    }).catch(() => {});

    // Step 4: AI enrichment (non-blocking — falls back to rule engine output)
    const threatContext = {
      scanType: input.scanType.toLowerCase() as any,
      content: input.content,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      signals: result.signals,
    };

    let aiResult = null;
    try {
      const [aiAnalysis, citizenAdvice] = await Promise.all([
        aiService.analyzeText(threatContext),
        aiService.generateCitizenAdvice(threatContext),
      ]);
      aiResult = {
        explanation: aiAnalysis.explanation,
        category: aiAnalysis.category,
        citizenAdvice,
        recommendations: aiAnalysis.recommendations,
        aiSummary: aiAnalysis.aiSummary,
      };
    } catch {
      // AI failed — we still have the rule engine result
      aiResult = null;
    }

    return {
      id: analysis.id,
      scanId: scan.id,
      scanType: input.scanType.toLowerCase(),
      riskScore: result.riskScore,
      riskLevel: result.riskLevel.toLowerCase(),
      confidence: result.confidence,
      summary: aiResult?.explanation || result.summary,
      recommendation: result.recommendation,
      signals: result.signals.map((s) => ({
        label: s.label,
        severity: s.severity.toLowerCase(),
        confidence: s.confidence,
        description: s.description,
      })),
      processingTime: Date.now() - startTime,
      timestamp: scan.createdAt.toISOString(),
      ai: aiResult,
    };
  },

  async getHistory(userId: string) {
    const scans = await scannerRepository.getUserScans(userId);
    return scans.map((scan) => ({
      id: scan.analysis?.id || scan.id,
      scanType: scan.scanType.toLowerCase(),
      content: scan.content.slice(0, 100),
      riskScore: scan.analysis?.riskScore || 0,
      riskLevel: (scan.analysis?.riskLevel || "SAFE").toLowerCase(),
      timestamp: scan.createdAt.toISOString(),
      status: scan.status.toLowerCase(),
    }));
  },

  async analyzeImageScan(input: { userId: string; imageBase64: string; mimeType: string; description?: string }) {
    const startTime = Date.now();

    // Step 1: AI vision analysis (primary for images — no rule engine for images)
    let aiResult;
    try {
      aiResult = await aiService.analyzeImage(input.imageBase64, input.mimeType, input.description);
    } catch (err: any) {
      // Fallback if AI is unavailable
      aiResult = {
        riskScore: 50,
        confidence: 0.5,
        category: "unknown",
        explanation: "AI vision analysis unavailable. Image could not be fully analyzed.",
        detectedSignals: ["Analysis pending"],
        recommendations: ["Manually review the image content.", "Report if suspicious."],
        aiSummary: "Image analysis incomplete — AI service unavailable.",
      };
    }

    const processingTime = Date.now() - startTime;

    // Step 2: Persist
    const riskLevel = aiResult.riskScore >= 80 ? "CRITICAL" : aiResult.riskScore >= 60 ? "HIGH" : aiResult.riskScore >= 40 ? "MEDIUM" : aiResult.riskScore >= 20 ? "LOW" : "SAFE";

    const scan = await scannerRepository.createScan({
      userId: input.userId,
      scanType: "QR", // Images stored as QR scan type
      content: `[IMAGE:${input.mimeType}] ${input.description || "Image scan"}`,
      metadata: { isImage: true, mimeType: input.mimeType },
    });

    const analysis = await scannerRepository.createAnalysis({
      scanId: scan.id,
      riskScore: aiResult.riskScore,
      riskLevel: riskLevel as any,
      summary: aiResult.explanation,
      recommendation: aiResult.recommendations.join(" "),
      confidence: aiResult.confidence,
      processingTime,
      signals: aiResult.detectedSignals.map((s) => ({
        label: s,
        severity: aiResult.riskScore >= 60 ? "HIGH" : "MEDIUM",
        confidence: aiResult.confidence,
        description: s,
      })),
    });

    // Notification (non-blocking)
    notificationService.notifyScanComplete(input.userId, scan.id, riskLevel, aiResult.riskScore, "IMAGE").catch(() => {});

    // Graph (non-blocking)
    graphService.processScan(scan.id, aiResult.explanation + " " + aiResult.detectedSignals.join(" "), riskLevel).catch(() => {});

    // Timeline (non-blocking)
    timelineService.publish({
      type: "THREAT_SCAN",
      actorId: input.userId,
      title: "Image scan completed",
      description: `Risk: ${aiResult.riskScore}/100 (${riskLevel})`,
      severity: aiResult.riskScore >= 60 ? "critical" : aiResult.riskScore >= 30 ? "warning" : "info",
      relatedAnalysis: analysis.id,
    }).catch(() => {});

    return {
      id: analysis.id,
      scanId: scan.id,
      scanType: "image",
      riskScore: aiResult.riskScore,
      riskLevel: riskLevel.toLowerCase(),
      confidence: aiResult.confidence,
      summary: aiResult.explanation,
      recommendation: aiResult.recommendations.join(" "),
      signals: aiResult.detectedSignals.map((s) => ({
        label: s,
        severity: aiResult.riskScore >= 60 ? "high" : "medium",
        confidence: aiResult.confidence,
        description: s,
      })),
      processingTime,
      timestamp: scan.createdAt.toISOString(),
      ai: {
        explanation: aiResult.explanation,
        category: aiResult.category,
        citizenAdvice: aiResult.aiSummary,
        recommendations: aiResult.recommendations,
        aiSummary: aiResult.aiSummary,
      },
    };
  },
};
