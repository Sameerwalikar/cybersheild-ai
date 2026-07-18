import { reportRepository } from "./report.repository.js";
import { notificationService } from "../notifications/index.js";
import { timelineService } from "../timeline/index.js";
import { graphService } from "../graph/index.js";
import { extractEntities } from "../graph/entity-extractor.js";
import type { CreateReportInput } from "./report.validator.js";
import { checkAndUpsertUpiFromText } from "../../utils/upiIntelHelper.js";

export const reportService = {
  async create(userId: string, input: CreateReportInput) {
    // 1. Determine priority based on content heuristics
    const priority = this.assessPriority(input);

    // 2. Store Report
    const report = await reportRepository.create({
      userId,
      type: input.type,
      description: input.description,
      scammerContact: input.scammerContact,
      financialLoss: input.financialLoss,
      evidence: input.evidence,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
      priority,
    });

    // 3. Create Notification for citizen
    notificationService.create({
      userId,
      type: "REPORT_UPDATE",
      severity: "INFO",
      title: "Report submitted",
      message: `Your report ${report.reportNumber} has been submitted and is pending review.`,
      actionUrl: `/reports`,
      relatedId: report.id,
    }).catch(() => {});

    // 4. Timeline event
    timelineService.publish({
      type: "REPORT_SUBMITTED",
      actorId: userId,
      title: `Report ${report.reportNumber} submitted`,
      description: `Category: ${input.type}. Priority: ${priority}. ${input.description.slice(0, 60)}`,
      severity: priority === "CRITICAL" || priority === "HIGH" ? "critical" : "info",
      relatedReport: report.id,
    }).catch(() => {});

    // 5. Extract entities and update fraud graph (non-blocking)
    this.processEntitiesAndGraph(report.id, input).catch(() => {});

    // 6. Scammer profile management (non-blocking)
    this.processScammerProfile(report.id, input).catch(() => {});

    // 6.5. Update UPI reputation if UPI is present in scammerContact or description
    const calculatedScore = priority === "CRITICAL" ? 85 : priority === "HIGH" ? 75 : 50;
    if (input.scammerContact?.upiId) {
      checkAndUpsertUpiFromText(input.scammerContact.upiId, calculatedScore, 1).catch(() => {});
    }
    checkAndUpsertUpiFromText(input.description, calculatedScore, 1).catch(() => {});

    // 7. Generate AI summary (non-blocking)
    this.generateAISummary(report.id, input).catch(() => {});

    return this.formatReport(report);
  },

  assessPriority(input: CreateReportInput): string {
    const desc = input.description.toLowerCase();
    const hasFinancialLoss = !!(input.financialLoss?.amount && input.financialLoss.amount > 0);
    const highAmount = input.financialLoss?.amount && input.financialLoss.amount > 50000;

    // Critical: high financial loss, identity theft, or multiple indicators
    if (highAmount || input.type === "Identity Theft") return "CRITICAL";
    if (hasFinancialLoss && input.financialLoss!.amount! > 10000) return "HIGH";
    if (desc.includes("aadhaar") || desc.includes("pan card") || desc.includes("otp")) return "HIGH";
    if (hasFinancialLoss) return "MEDIUM";
    return "MEDIUM";
  },

  async processEntitiesAndGraph(reportId: string, input: CreateReportInput) {
    // Build content string from all available information
    const contentParts: string[] = [input.description];
    if (input.scammerContact?.phone) contentParts.push(input.scammerContact.phone);
    if (input.scammerContact?.email) contentParts.push(input.scammerContact.email);
    if (input.scammerContact?.upiId) contentParts.push(input.scammerContact.upiId);
    if (input.scammerContact?.website) contentParts.push(input.scammerContact.website);

    const content = contentParts.join(" ");
    const riskLevel = this.assessPriority(input) === "CRITICAL" ? "HIGH" : "MEDIUM";

    // Use existing graph service to process entities
    await graphService.processScan(reportId, content, riskLevel);
  },

  async processScammerProfile(reportId: string, input: CreateReportInput) {
    if (!input.scammerContact) return;

    const { phone, email, upiId, website } = input.scammerContact;
    if (!phone && !email && !upiId && !website) return;

    // Search for existing scammer profile
    const existing = await reportRepository.findScammerByContact(input.scammerContact);

    if (existing) {
      // Update existing profile — recurring scammer
      await reportRepository.updateScammerProfile(existing.id, {
        phones: phone ? [phone] : undefined,
        emails: email ? [email.toLowerCase()] : undefined,
        upiIds: upiId ? [upiId.toLowerCase()] : undefined,
        domains: website ? [website.toLowerCase()] : undefined,
        reportId: reportId,
        threatLevel: existing.occurrences >= 3 ? "HIGH" : existing.occurrences >= 1 ? "MEDIUM" : "LOW",
      });
      await reportRepository.update(reportId, { scammerProfileId: existing.id });
    } else {
      // Create new scammer profile
      const profile = await reportRepository.createScammerProfile({
        phones: phone ? [phone] : [],
        emails: email ? [email.toLowerCase()] : [],
        upiIds: upiId ? [upiId.toLowerCase()] : [],
        domains: website ? [website.toLowerCase()] : [],
        urls: [],
        reportId: reportId,
      });
      await reportRepository.update(reportId, { scammerProfileId: profile.id });
    }
  },

  async generateAISummary(reportId: string, input: CreateReportInput) {
    // Generate a rule-based summary (always available, no AI dependency)
    const parts: string[] = [];
    parts.push(`${input.type} report.`);
    if (input.scammerContact?.phone) parts.push(`Scammer phone: ${input.scammerContact.phone}.`);
    if (input.scammerContact?.email) parts.push(`Scammer email: ${input.scammerContact.email}.`);
    if (input.scammerContact?.upiId) parts.push(`Scammer UPI: ${input.scammerContact.upiId}.`);
    if (input.financialLoss?.amount) parts.push(`Financial loss: ₹${input.financialLoss.amount.toLocaleString()}.`);
    parts.push(`Description: ${input.description.slice(0, 120)}`);

    const summary = parts.join(" ");
    await reportRepository.update(reportId, { aiSummary: summary });
  },

  async listByUser(userId: string, params: { status?: string; page?: number; limit?: number }) {
    const { items, total, page, limit } = await reportRepository.listByUser(userId, params);
    return {
      items: items.map(this.formatReport),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string, userId?: string) {
    const report = await reportRepository.getById(id, userId);
    if (!report) return null;
    return {
      ...this.formatReport(report),
      citizenName: report.user?.profile?.name || "Anonymous",
      citizenEmail: report.user?.email || "",
      citizenPhone: report.user?.profile?.phone || null,
      investigation: report.investigation ? {
        id: report.investigation.id,
        caseId: report.investigation.caseId,
        status: report.investigation.status.toLowerCase(),
      } : null,
    };
  },

  async getDetailedById(id: string) {
    const report = await reportRepository.getDetailedById(id);
    if (!report) return null;

    // Get scammer profile if linked
    let scammerProfile = null;
    if (report.scammerProfileId) {
      scammerProfile = await reportRepository.getScammerProfile(report.scammerProfileId);
    }

    // Get related entities from fraud graph
    const contentParts: string[] = [report.description];
    if (report.scammerContact) {
      const sc = report.scammerContact as any;
      if (sc.phone) contentParts.push(sc.phone);
      if (sc.email) contentParts.push(sc.email);
      if (sc.upiId) contentParts.push(sc.upiId);
    }
    const entities = extractEntities(contentParts.join(" "));

    return {
      ...this.formatReport(report),
      citizenName: report.user?.profile?.name || "Anonymous",
      citizenEmail: report.user?.email || "",
      citizenPhone: report.user?.profile?.phone || null,
      citizenLocation: report.user?.profile?.location || null,
      aiSummary: report.aiSummary,
      internalNotes: report.internalNotes || [],
      acknowledgement: report.acknowledgement,
      investigation: report.investigation ? {
        id: report.investigation.id,
        caseId: report.investigation.caseId,
        status: report.investigation.status.toLowerCase(),
        evidence: report.investigation.evidence?.map((e: any) => ({ id: e.id, type: e.type, value: e.value })) || [],
      } : null,
      scammerProfile: scammerProfile ? {
        id: scammerProfile.id,
        phones: scammerProfile.phones,
        emails: scammerProfile.emails,
        upiIds: scammerProfile.upiIds,
        domains: scammerProfile.domains,
        occurrences: scammerProfile.occurrences,
        totalReports: scammerProfile.totalReports,
        threatLevel: scammerProfile.threatLevel.toLowerCase(),
        firstSeen: scammerProfile.firstSeen.toISOString(),
        lastSeen: scammerProfile.lastSeen.toISOString(),
      } : null,
      extractedEntities: entities.map((e) => ({ type: e.type.toLowerCase(), value: e.value })),
    };
  },

  async listAll(params: { status?: string; priority?: string; page?: number; limit?: number }) {
    const { items, total, page, limit } = await reportRepository.listAll(params);
    return {
      items: items.map((r) => ({
        ...this.formatReport(r),
        citizenName: r.user?.profile?.name || "Anonymous",
        citizenEmail: r.user?.email || "",
        aiSummary: r.aiSummary,
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async updateStatus(id: string, status: string, actorId: string) {
    const validStatuses = ["SUBMITTED", "UNDER_REVIEW", "INVESTIGATING", "ACTION_TAKEN", "RESOLVED", "REJECTED", "ARCHIVED"];
    const upper = status.toUpperCase();
    if (!validStatuses.includes(upper)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const report = await reportRepository.updateStatus(id, upper as any);

    // Notify citizen about status change
    notificationService.create({
      userId: report.userId,
      type: "REPORT_UPDATE",
      severity: upper === "RESOLVED" ? "INFO" : "WARNING",
      title: `Report ${report.reportNumber} updated`,
      message: `Your report status changed to: ${upper.toLowerCase().replace(/_/g, " ")}`,
      actionUrl: `/reports`,
      relatedId: report.id,
    }).catch(() => {});

    // Timeline
    timelineService.publish({
      type: "REPORT_STATUS_CHANGE",
      actorId: actorId,
      actorType: "user",
      title: `Report ${report.reportNumber} status: ${upper.toLowerCase().replace(/_/g, " ")}`,
      severity: upper === "INVESTIGATING" || upper === "ACTION_TAKEN" ? "warning" : "info",
      relatedReport: report.id,
    }).catch(() => {});

    return this.formatReport(report);
  },

  async assignOfficer(id: string, officerId: string, actorId: string) {
    const report = await reportRepository.update(id, { assignedTo: officerId });
    if (!report) throw new Error("Report not found");

    // Also move to UNDER_REVIEW if still SUBMITTED
    const full = await reportRepository.getById(id);
    if (full && full.status === "SUBMITTED") {
      await reportRepository.updateStatus(id, "UNDER_REVIEW" as any);
    }

    // Notify officer
    notificationService.create({
      userId: officerId,
      type: "SYSTEM",
      severity: "WARNING",
      title: "Report assigned to you",
      message: `Report ${full?.reportNumber} has been assigned for investigation.`,
      actionUrl: `/reports`,
      relatedId: id,
    }).catch(() => {});

    // Timeline
    timelineService.publish({
      type: "REPORT_ASSIGNED",
      actorId: actorId,
      title: `Report ${full?.reportNumber} assigned to officer`,
      severity: "info",
      relatedReport: id,
    }).catch(() => {});

    return report;
  },

  async acknowledge(id: string, message: string, actorId: string) {
    const report = await reportRepository.getById(id);
    if (!report) throw new Error("Report not found");

    await reportRepository.update(id, { acknowledgement: message });

    // Notify citizen with acknowledgement
    notificationService.create({
      userId: report.userId,
      type: "REPORT_UPDATE",
      severity: "INFO",
      title: `Update on ${report.reportNumber}`,
      message,
      actionUrl: `/reports`,
      relatedId: id,
    }).catch(() => {});

    // Timeline
    timelineService.publish({
      type: "REPORT_ACKNOWLEDGED",
      actorId: actorId,
      title: `Report ${report.reportNumber} acknowledged`,
      description: message,
      severity: "info",
      relatedReport: id,
    }).catch(() => {});

    return { success: true };
  },

  async addNote(id: string, note: string, actorId: string) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${note}`;
    const report = await reportRepository.addNote(id, formatted);
    if (!report) throw new Error("Report not found");

    timelineService.publish({
      type: "REPORT_NOTE_ADDED",
      actorId: actorId,
      title: `Note added to report`,
      description: note.slice(0, 80),
      severity: "info",
      relatedReport: id,
    }).catch(() => {});

    return { success: true };
  },

  async getStats() {
    return reportRepository.getStats();
  },

  async getScammerProfiles(page = 1, limit = 20) {
    const { items, total } = await reportRepository.listScammerProfiles(page, limit);
    return {
      items: items.map((p) => ({
        id: p.id,
        phones: p.phones,
        emails: p.emails,
        upiIds: p.upiIds,
        domains: p.domains,
        threatLevel: p.threatLevel.toLowerCase(),
        occurrences: p.occurrences,
        totalReports: p.totalReports,
        firstSeen: p.firstSeen.toISOString(),
        lastSeen: p.lastSeen.toISOString(),
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async getTopReportedEntities() {
    const profiles = await reportRepository.getTopReportedEntities(10);
    return profiles.map((p) => ({
      id: p.id,
      primaryIdentifier: p.phones[0] || p.emails[0] || p.upiIds[0] || "Unknown",
      type: p.phones.length > 0 ? "phone" : p.emails.length > 0 ? "email" : "upi",
      occurrences: p.occurrences,
      totalReports: p.totalReports,
      threatLevel: p.threatLevel.toLowerCase(),
    }));
  },

  formatReport(report: any) {
    return {
      id: report.id,
      reportNumber: report.reportNumber,
      type: report.type,
      description: report.description,
      status: report.status.toLowerCase(),
      priority: report.priority.toLowerCase(),
      scammerContact: report.scammerContact,
      financialLoss: report.financialLoss,
      evidence: report.evidence || [],
      attachments: (report.evidence || []).length,
      aiSummary: report.aiSummary || null,
      acknowledgement: report.acknowledgement || null,
      assignedTo: report.assignedTo || null,
      occurredAt: report.occurredAt?.toISOString() || null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  },
};
