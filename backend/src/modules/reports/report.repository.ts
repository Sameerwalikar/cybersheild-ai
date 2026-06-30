import { prisma } from "../../config/database.js";
import type { ReportStatus } from "@prisma/client";

function generateReportNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `RPT-${year}-${rand}`;
}

interface CreateReportData {
  userId: string;
  type: string;
  description: string;
  scammerContact?: any;
  financialLoss?: any;
  evidence?: string[];
  occurredAt?: Date;
  priority?: string;
}

export const reportRepository = {
  async create(data: CreateReportData) {
    return prisma.threatReport.create({
      data: {
        reportNumber: generateReportNumber(),
        userId: data.userId,
        type: data.type,
        description: data.description,
        scammerContact: data.scammerContact || undefined,
        financialLoss: data.financialLoss || undefined,
        evidence: data.evidence || [],
        priority: (data.priority?.toUpperCase() || "MEDIUM") as any,
        occurredAt: data.occurredAt || undefined,
        internalNotes: [],
      },
      include: { user: { include: { profile: true } } },
    });
  },

  async listByUser(userId: string, params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const where: any = { userId };

    if (status && status !== "all" && status !== "undefined") {
      where.status = status.toUpperCase() as ReportStatus;
    }

    const [items, total] = await Promise.all([
      prisma.threatReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.threatReport.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  async getById(id: string, userId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;

    return prisma.threatReport.findFirst({
      where,
      include: { user: { include: { profile: true } }, investigation: true },
    });
  },

  async getDetailedById(id: string) {
    return prisma.threatReport.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
        investigation: { include: { evidence: true, network: true } },
      },
    });
  },

  async listAll(params: { status?: string; priority?: string; page?: number; limit?: number }) {
    const { status, priority, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const where: any = {};

    if (status && status !== "all" && status !== "undefined") {
      where.status = status.toUpperCase() as ReportStatus;
    }
    if (priority && priority !== "all" && priority !== "undefined") {
      where.priority = priority.toUpperCase();
    }

    const [items, total] = await Promise.all([
      prisma.threatReport.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
        include: { user: { include: { profile: true } } },
      }),
      prisma.threatReport.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  async updateStatus(id: string, status: ReportStatus, assignedTo?: string) {
    return prisma.threatReport.update({
      where: { id },
      data: {
        status,
        ...(assignedTo ? { assignedTo } : {}),
        ...(status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
      },
      include: { user: { include: { profile: true } } },
    });
  },

  async update(id: string, data: Partial<{
    aiSummary: string;
    priority: string;
    assignedTo: string;
    acknowledgement: string;
    scammerProfileId: string;
    internalNotes: string[];
  }>) {
    const updateData: any = {};
    if (data.aiSummary !== undefined) updateData.aiSummary = data.aiSummary;
    if (data.priority) updateData.priority = data.priority.toUpperCase();
    if (data.assignedTo) updateData.assignedTo = data.assignedTo;
    if (data.acknowledgement) updateData.acknowledgement = data.acknowledgement;
    if (data.scammerProfileId) updateData.scammerProfileId = data.scammerProfileId;
    if (data.internalNotes) updateData.internalNotes = data.internalNotes;

    return prisma.threatReport.update({ where: { id }, data: updateData });
  },

  async addNote(id: string, note: string) {
    const report = await prisma.threatReport.findUnique({ where: { id }, select: { internalNotes: true } });
    if (!report) return null;
    const notes = [...(report.internalNotes || []), note];
    return prisma.threatReport.update({ where: { id }, data: { internalNotes: notes } });
  },

  async getStats() {
    const [total, submitted, underReview, investigating, resolved, critical] = await Promise.all([
      prisma.threatReport.count(),
      prisma.threatReport.count({ where: { status: "SUBMITTED" } }),
      prisma.threatReport.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.threatReport.count({ where: { status: "INVESTIGATING" } }),
      prisma.threatReport.count({ where: { status: "RESOLVED" } }),
      prisma.threatReport.count({ where: { priority: "CRITICAL" } }),
    ]);
    return { total, submitted, underReview, investigating, resolved, critical };
  },

  // Scammer Profile operations
  async findScammerByContact(contact: { phone?: string; email?: string; upiId?: string; website?: string }) {
    const orConditions: any[] = [];
    if (contact.phone) orConditions.push({ phones: { has: contact.phone } });
    if (contact.email) orConditions.push({ emails: { has: contact.email.toLowerCase() } });
    if (contact.upiId) orConditions.push({ upiIds: { has: contact.upiId.toLowerCase() } });
    if (contact.website) orConditions.push({ domains: { has: contact.website.toLowerCase() } });

    if (orConditions.length === 0) return null;

    return prisma.scammerProfile.findFirst({
      where: { OR: orConditions },
    });
  },

  async createScammerProfile(data: {
    phones: string[];
    emails: string[];
    upiIds: string[];
    domains: string[];
    urls: string[];
    reportId: string;
  }) {
    return prisma.scammerProfile.create({
      data: {
        phones: data.phones,
        emails: data.emails,
        upiIds: data.upiIds,
        domains: data.domains,
        urls: data.urls,
        walletIds: [],
        aliases: [],
        reportIds: [data.reportId],
        graphNodeIds: [],
        totalReports: 1,
        occurrences: 1,
      },
    });
  },

  async updateScammerProfile(id: string, data: {
    phones?: string[];
    emails?: string[];
    upiIds?: string[];
    domains?: string[];
    urls?: string[];
    reportId: string;
    threatLevel?: string;
  }) {
    const existing = await prisma.scammerProfile.findUnique({ where: { id } });
    if (!existing) return null;

    const mergeUnique = (existing: string[], newItems: string[]) => [...new Set([...existing, ...newItems])];

    return prisma.scammerProfile.update({
      where: { id },
      data: {
        phones: data.phones ? mergeUnique(existing.phones, data.phones) : undefined,
        emails: data.emails ? mergeUnique(existing.emails, data.emails) : undefined,
        upiIds: data.upiIds ? mergeUnique(existing.upiIds, data.upiIds) : undefined,
        domains: data.domains ? mergeUnique(existing.domains, data.domains) : undefined,
        urls: data.urls ? mergeUnique(existing.urls, data.urls) : undefined,
        reportIds: mergeUnique(existing.reportIds, [data.reportId]),
        occurrences: existing.occurrences + 1,
        totalReports: existing.totalReports + 1,
        threatLevel: (data.threatLevel?.toUpperCase() as any) || undefined,
        lastSeen: new Date(),
      },
    });
  },

  async getScammerProfile(id: string) {
    return prisma.scammerProfile.findUnique({ where: { id } });
  },

  async listScammerProfiles(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.scammerProfile.findMany({ orderBy: { occurrences: "desc" }, take: limit, skip: offset }),
      prisma.scammerProfile.count(),
    ]);
    return { items, total, page, limit };
  },

  async getTopReportedEntities(limit = 10) {
    const profiles = await prisma.scammerProfile.findMany({
      orderBy: { occurrences: "desc" },
      take: limit,
    });
    return profiles;
  },
};
