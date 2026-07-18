import { prisma } from "../../config/database.js";
import { createHash } from "crypto";
import { aiService } from "../ai/index.js";
import { notificationService } from "../notifications/index.js";
import { graphService } from "../graph/index.js";
import { dashboardService } from "../dashboard/dashboard.service.js";
import { AppError } from "../../utils/AppError.js";
import { checkAndUpsertUpiFromText } from "../../utils/upiIntelHelper.js";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadInput {
  userId: string;
  filename: string;
  mimeType: string;
  fileBase64: string;
}

export const evidenceService = {
  async upload(input: UploadInput) {
    // Validate
    if (!ALLOWED_TYPES.includes(input.mimeType)) {
      throw new AppError(`Unsupported file type: ${input.mimeType}. Allowed: PNG, JPG, WEBP, PDF`, 400, "UNSUPPORTED_FILE");
    }

    const fileSize = Math.ceil((input.fileBase64.length * 3) / 4);
    if (fileSize > MAX_SIZE) {
      throw new AppError("File exceeds 10MB size limit", 400, "FILE_TOO_LARGE");
    }

    // Hash for deduplication
    const fileHash = createHash("sha256").update(input.fileBase64).digest("hex");

    // Check for duplicate
    const existing = await prisma.evidenceUpload.findUnique({
      where: { userId_fileHash: { userId: input.userId, fileHash } },
    });

    if (existing) {
      return {
        id: existing.id,
        cached: true,
        filename: existing.filename,
        mimeType: existing.mimeType,
        riskScore: existing.riskScore || 0,
        riskLevel: existing.riskLevel || "safe",
        visionSummary: existing.visionSummary || "Previously analyzed file.",
        detectedEntities: existing.detectedEntities || [],
        confidence: existing.confidence || 0,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    // Analyze with NVIDIA Vision
    let analysisResult;
    try {
      if (input.mimeType === "application/pdf") {
        // For PDF, treat as text extraction placeholder (Vision can't process PDF directly)
        analysisResult = await aiService.analyzeText({
          scanType: "message",
          content: `[PDF Document: ${input.filename}] Please analyze this document for cyber threats.`,
          riskScore: 0,
          riskLevel: "SAFE",
          signals: [],
        });
      } else {
        analysisResult = await aiService.analyzeImage(input.fileBase64, input.mimeType, `Analyze this evidence file: ${input.filename}`);
      }
    } catch (err: any) {
      console.error("Evidence vision analysis failed:", err.message);
      analysisResult = {
        riskScore: 30,
        confidence: 0.3,
        category: "unknown",
        explanation: "Vision analysis could not be completed. Manual review recommended.",
        detectedSignals: ["Analysis incomplete"],
        recommendations: ["Review the file manually", "Report if suspicious"],
        aiSummary: "Unable to fully analyze this evidence.",
      };
    }

    // Persist
    const record = await prisma.evidenceUpload.create({
      data: {
        userId: input.userId,
        filename: input.filename,
        mimeType: input.mimeType,
        fileSize,
        fileHash,
        storagePath: null, // Base64 stored inline for now
        visionSummary: analysisResult.explanation,
        detectedEntities: analysisResult.detectedSignals,
        confidence: analysisResult.confidence,
        riskScore: analysisResult.riskScore,
        riskLevel: analysisResult.riskScore >= 80 ? "critical" : analysisResult.riskScore >= 60 ? "high" : analysisResult.riskScore >= 40 ? "medium" : analysisResult.riskScore >= 20 ? "low" : "safe",
      },
    });

    // Extract and upsert UPIs from filename, vision summary, or detected signals
    const contentToScan = `${input.filename} ${analysisResult.explanation} ${analysisResult.detectedSignals.join(" ")}`;
    checkAndUpsertUpiFromText(contentToScan, analysisResult.riskScore, 1).catch(() => {});

    // Create notification (non-blocking)
    const isHighRisk = analysisResult.riskScore >= 60;
    notificationService.create({
      userId: input.userId,
      type: isHighRisk ? "THREAT_ALERT" : "SCAN_COMPLETE",
      severity: isHighRisk ? "CRITICAL" : "INFO",
      title: isHighRisk ? "High-risk evidence detected" : "Evidence analysis complete",
      message: `${input.filename} analyzed. Risk: ${analysisResult.riskScore}/100.`,
      relatedId: record.id,
      actionUrl: `/evidence`,
    }).catch(() => {});

    // Invalidate dashboard cache (non-blocking)
    dashboardService.invalidateUser(input.userId);

    // Graph extraction (non-blocking)
    if (analysisResult.explanation) {
      graphService.processScan(record.id, analysisResult.explanation + " " + analysisResult.detectedSignals.join(" "), record.riskLevel?.toUpperCase() || "SAFE").catch(() => {});
    }

    return {
      id: record.id,
      cached: false,
      filename: record.filename,
      mimeType: record.mimeType,
      riskScore: record.riskScore || 0,
      riskLevel: record.riskLevel || "safe",
      visionSummary: record.visionSummary || "",
      detectedEntities: record.detectedEntities || [],
      confidence: record.confidence || 0,
      createdAt: record.createdAt.toISOString(),
    };
  },

  async list(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.evidenceUpload.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
      prisma.evidenceUpload.count({ where: { userId } }),
    ]);

    return {
      items: items.map((e) => ({
        id: e.id,
        filename: e.filename,
        mimeType: e.mimeType,
        fileSize: e.fileSize,
        riskScore: e.riskScore || 0,
        riskLevel: e.riskLevel || "safe",
        visionSummary: e.visionSummary || "",
        detectedEntities: e.detectedEntities || [],
        confidence: e.confidence || 0,
        createdAt: e.createdAt.toISOString(),
      })),
      pagination: { total, page, limit },
    };
  },

  async getById(id: string, userId: string) {
    const e = await prisma.evidenceUpload.findFirst({ where: { id, userId } });
    if (!e) return null;
    return {
      id: e.id,
      filename: e.filename,
      mimeType: e.mimeType,
      fileSize: e.fileSize,
      riskScore: e.riskScore || 0,
      riskLevel: e.riskLevel || "safe",
      visionSummary: e.visionSummary || "",
      detectedEntities: e.detectedEntities || [],
      confidence: e.confidence || 0,
      createdAt: e.createdAt.toISOString(),
    };
  },

  async remove(id: string, userId: string) {
    const e = await prisma.evidenceUpload.findFirst({ where: { id, userId } });
    if (!e) return null;
    await prisma.evidenceUpload.delete({ where: { id } });
    return { deleted: true };
  },

  // ─── Police Methods ───────────────────────────────────────────────

  async listAllPolice(params: { status?: string; riskLevel?: string; page?: number; limit?: number }) {
    const { status, riskLevel, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const where: any = {};
    if (status && status !== "all" && status !== "undefined") where.status = status;
    if (riskLevel && riskLevel !== "all" && riskLevel !== "undefined") where.riskLevel = riskLevel;

    const [items, total] = await Promise.all([
      prisma.evidenceUpload.findMany({
        where,
        orderBy: [{ riskScore: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
        include: { user: { include: { profile: true } } },
      }),
      prisma.evidenceUpload.count({ where }),
    ]);

    return {
      items: items.map((e) => ({
        id: e.id,
        filename: e.filename,
        mimeType: e.mimeType,
        fileSize: e.fileSize,
        riskScore: e.riskScore || 0,
        riskLevel: e.riskLevel || "safe",
        visionSummary: e.visionSummary?.slice(0, 100) || "",
        confidence: e.confidence || 0,
        status: e.status,
        citizenName: e.user?.profile?.name || "Anonymous",
        citizenEmail: e.user?.email || "",
        createdAt: e.createdAt.toISOString(),
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async policeGetById(id: string) {
    const e = await prisma.evidenceUpload.findUnique({
      where: { id },
      include: { user: { include: { profile: true } } },
    });
    if (!e) return null;

    return {
      id: e.id,
      filename: e.filename,
      mimeType: e.mimeType,
      fileSize: e.fileSize,
      riskScore: e.riskScore || 0,
      riskLevel: e.riskLevel || "safe",
      visionSummary: e.visionSummary || "",
      detectedEntities: e.detectedEntities || [],
      confidence: e.confidence || 0,
      status: e.status,
      acknowledgement: e.acknowledgement,
      internalNotes: e.internalNotes || [],
      citizenName: e.user?.profile?.name || "Anonymous",
      citizenEmail: e.user?.email || "",
      citizenPhone: e.user?.profile?.phone || null,
      citizenId: e.userId,
      createdAt: e.createdAt.toISOString(),
    };
  },

  async policeStats() {
    const [total, pendingReview, highRisk, critical] = await Promise.all([
      prisma.evidenceUpload.count(),
      prisma.evidenceUpload.count({ where: { status: "pending_review" } }),
      prisma.evidenceUpload.count({ where: { riskLevel: { in: ["high", "critical"] } } }),
      prisma.evidenceUpload.count({ where: { riskLevel: "critical" } }),
    ]);
    return { total, pendingReview, highRisk, critical };
  },

  async updateStatus(id: string, status: string, actorId: string) {
    const e = await prisma.evidenceUpload.findUnique({ where: { id } });
    if (!e) return null;

    await prisma.evidenceUpload.update({ where: { id }, data: { status } });

    // Notify citizen
    notificationService.create({
      userId: e.userId,
      type: "REPORT_UPDATE",
      severity: "INFO",
      title: "Evidence status updated",
      message: `Your evidence "${e.filename}" status: ${status.replace(/_/g, " ")}`,
      relatedId: id,
    }).catch(() => {});

    return { success: true };
  },

  async acknowledge(id: string, message: string, status: string, actorId: string) {
    const e = await prisma.evidenceUpload.findUnique({ where: { id } });
    if (!e) return null;

    await prisma.evidenceUpload.update({ where: { id }, data: { acknowledgement: message, status } });

    // Notify citizen
    notificationService.create({
      userId: e.userId,
      type: "REPORT_UPDATE",
      severity: "INFO",
      title: "Evidence acknowledgement",
      message,
      relatedId: id,
    }).catch(() => {});

    return { success: true };
  },

  async addNote(id: string, note: string, actorId: string) {
    const e = await prisma.evidenceUpload.findUnique({ where: { id } });
    if (!e) return null;

    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${note}`;
    const notes = [...(e.internalNotes || []), formatted];
    await prisma.evidenceUpload.update({ where: { id }, data: { internalNotes: notes } });

    return { success: true };
  },
};
