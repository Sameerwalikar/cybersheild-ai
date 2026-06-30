import { prisma } from "../../config/database.js";
import type { ScanType, RiskLevel } from "@prisma/client";

interface CreateScanData {
  userId: string;
  scanType: ScanType;
  content: string;
  metadata?: any;
}

interface CreateAnalysisData {
  scanId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  recommendation: string;
  confidence: number;
  processingTime: number;
  signals: any[];
}

export const scannerRepository = {
  async createScan(data: CreateScanData) {
    return prisma.threatScan.create({
      data: {
        userId: data.userId,
        scanType: data.scanType,
        content: data.content,
        status: "COMPLETED",
        metadata: data.metadata || undefined,
      },
    });
  },

  async createAnalysis(data: CreateAnalysisData) {
    return prisma.threatAnalysis.create({
      data: {
        scanId: data.scanId,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        summary: data.summary,
        recommendation: data.recommendation,
        confidence: data.confidence,
        processingTime: data.processingTime,
        indicators: {
          create: data.signals.map((s) => ({
            label: s.label,
            severity: s.severity as RiskLevel,
            confidence: s.confidence,
            description: s.description,
            indicators: [],
          })),
        },
      },
      include: { indicators: true },
    });
  },

  async getUserScans(userId: string, limit = 20) {
    return prisma.threatScan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { analysis: { include: { indicators: true } } },
    });
  },
};
