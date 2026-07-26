import { prisma } from "../../config/database.js";
import { createHash, randomUUID } from "crypto";
import { aiService } from "../ai/index.js";
import fs from "fs";
import path from "path";
import { notificationService } from "../notifications/index.js";
import { graphService } from "../graph/index.js";
import { dashboardService } from "../dashboard/dashboard.service.js";
import { AppError } from "../../utils/AppError.js";
import axios from "axios";
import { env } from "../../config/env.js";
import { checkAndUpsertUpiFromText } from "../../utils/upiIntelHelper.js";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadInput {
  userId: string;
  filename: string;
  mimeType: string;
  fileBase64: string;
  reportId?: string;
}

const checkVirusTotal = async (fileHash: string) => {
  if (!env.VIRUSTOTAL_API_KEY) {
    console.warn("VirusTotal API key is not configured. Skipping file hash check.");
    return null;
  }
  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/files/${fileHash}`,
      {
        headers: {
          "x-apikey": env.VIRUSTOTAL_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // File not found in VirusTotal database
      return null;
    }

    throw error;
  }
};

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
      include: { report: { select: { id: true, reportNumber: true, type: true } } },
    });

    if (existing) {
      let currentReport = existing.report;
      // If user provided a reportId and existing item was unlinked or changed, update it
      if (input.reportId && existing.reportId !== input.reportId) {
        const updated = await prisma.evidenceUpload.update({
          where: { id: existing.id },
          data: { reportId: input.reportId },
          include: { report: { select: { id: true, reportNumber: true, type: true } } },
        });
        currentReport = updated.report;
      }

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
        reportId: currentReport?.id || existing.reportId || null,
        reportNumber: currentReport?.reportNumber || null,
        reportType: currentReport?.type || null,
        createdAt: existing.createdAt.toISOString(),
        storagePath: existing.storagePath,
      };
    }
    // --------------------
    // VirusTotal Scan
    // --------------------
    const vtResult = await checkVirusTotal(fileHash);

    if (vtResult) {
      const stats = vtResult.data.attributes.last_analysis_stats;

      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;

      if (malicious > 0 || suspicious > 0) {
        throw new AppError(
          "File blocked. VirusTotal detected malware.",
          400,
          "MALICIOUS_FILE"
        );
      }
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

    // Save file locally
    let storagePath: string | null = null;
    try {
      let ext = "bin";
      if (input.mimeType === "image/png") ext = "png";
      else if (input.mimeType === "image/jpeg" || input.mimeType === "image/jpg") ext = "jpg";
      else if (input.mimeType === "image/webp") ext = "webp";
      else if (input.mimeType === "application/pdf") ext = "pdf";
      else {
        const parts = input.filename.split(".");
        if (parts.length > 1) ext = parts.pop()!;
      }
      const uniqueFilename = `${randomUUID()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, uniqueFilename);
      const buffer = Buffer.from(input.fileBase64, "base64");
      fs.writeFileSync(filePath, buffer);
      storagePath = `/uploads/${uniqueFilename}`;
    } catch (writeErr: any) {
      console.error("Failed to save evidence file:", writeErr.message);
    }

    // Persist
    const record = await prisma.evidenceUpload.create({
      data: {
        userId: input.userId,
        reportId: input.reportId || null,
        filename: input.filename,
        mimeType: input.mimeType,
        fileSize,
        fileHash,
        storagePath,
        visionSummary: analysisResult.explanation,
        detectedEntities: analysisResult.detectedSignals || [],
        confidence: analysisResult.confidence,
        riskScore: analysisResult.riskScore,
        riskLevel: analysisResult.riskScore >= 80 ? "critical" : analysisResult.riskScore >= 60 ? "high" : analysisResult.riskScore >= 40 ? "medium" : analysisResult.riskScore >= 20 ? "low" : "safe",
      },
    });

    const detectedSignalsArr = Array.isArray(analysisResult.detectedSignals) ? analysisResult.detectedSignals : [];

    // Extract and upsert UPIs from filename, vision summary, or detected signals
    const contentToScan = `${input.filename} ${analysisResult.explanation} ${detectedSignalsArr.join(" ")}`;
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
    }).catch(() => { });

    // Invalidate dashboard cache (non-blocking)
    dashboardService.invalidateUser(input.userId);

    // Graph extraction (non-blocking)
    if (analysisResult.explanation) {
      graphService.processScan(record.id, analysisResult.explanation + " " + detectedSignalsArr.join(" "), record.riskLevel?.toUpperCase() || "SAFE").catch(() => {});
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
      reportId: record.reportId || null,
      createdAt: record.createdAt.toISOString(),
      storagePath: record.storagePath,
    };
  },

  async list(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.evidenceUpload.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: { report: { select: { id: true, reportNumber: true, type: true } } },
      }),
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
        reportId: e.reportId || null,
        reportNumber: e.report?.reportNumber || null,
        reportType: e.report?.type || null,
        createdAt: e.createdAt.toISOString(),
        storagePath: e.storagePath,
      })),
      pagination: { total, page, limit },
    };
  },

  async getById(id: string, userId: string) {
    const e = await prisma.evidenceUpload.findFirst({
      where: { id, userId },
      include: { report: { select: { id: true, reportNumber: true, type: true } } },
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
      reportId: e.reportId || null,
      reportNumber: e.report?.reportNumber || null,
      reportType: e.report?.type || null,
      createdAt: e.createdAt.toISOString(),
      storagePath: e.storagePath,
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
        include: {
          user: { include: { profile: true } },
          report: { select: { id: true, reportNumber: true, type: true, description: true, status: true } },
        },
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
        reportId: e.reportId || null,
        reportNumber: e.report?.reportNumber || null,
        reportType: e.report?.type || null,
        reportDescription: e.report?.description?.slice(0, 80) || null,
        reportStatus: e.report?.status?.toLowerCase() || null,
        createdAt: e.createdAt.toISOString(),
        storagePath: e.storagePath,
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async policeGetById(id: string) {
    const e = await prisma.evidenceUpload.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
        report: { select: { id: true, reportNumber: true, type: true, description: true, status: true, priority: true, scammerContact: true, financialLoss: true, createdAt: true } },
      },
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
      // Linked complaint
      reportId: e.reportId || null,
      reportNumber: e.report?.reportNumber || null,
      reportType: e.report?.type || null,
      reportDescription: e.report?.description || null,
      reportStatus: e.report?.status?.toLowerCase() || null,
      reportPriority: e.report?.priority?.toLowerCase() || null,
      reportScammerContact: e.report?.scammerContact || null,
      reportFinancialLoss: e.report?.financialLoss || null,
      reportCreatedAt: e.report?.createdAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
      storagePath: e.storagePath,
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
    }).catch(() => { });

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
    }).catch(() => { });

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
