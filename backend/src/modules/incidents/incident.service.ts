import { prisma } from "../../config/database.js";
import { notificationService } from "../notifications/index.js";
import { timelineService } from "../timeline/index.js";
import type { IncidentStatus, IncidentPriority } from "@prisma/client";

const STATUS_ORDER: IncidentStatus[] = ["NEW", "UNDER_REVIEW", "INVESTIGATING", "ACTION_TAKEN", "RESOLVED", "ARCHIVED"];

function generateIncidentId(): string {
  const date = new Date();
  const yr = date.getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `CS-${yr}-${num}`;
}

interface CreateIncidentInput {
  title: string;
  description?: string;
  priority?: string;
  severity?: string;
  createdBy: string;
  relatedReportIds?: string[];
  relatedScanIds?: string[];
  relatedNodeIds?: string[];
}

export const incidentService = {
  async create(input: CreateIncidentInput) {
    const incident = await prisma.incident.create({
      data: {
        incidentId: generateIncidentId(),
        title: input.title,
        description: input.description,
        priority: (input.priority?.toUpperCase() || "MEDIUM") as IncidentPriority,
        severity: input.severity || "medium",
        createdBy: input.createdBy,
        relatedReportIds: input.relatedReportIds || [],
        relatedScanIds: input.relatedScanIds || [],
        relatedNodeIds: input.relatedNodeIds || [],
        timeline: { create: { eventType: "CREATED", description: "Investigation created", actorId: input.createdBy } },
      },
    });

    notificationService.create({
      userId: input.createdBy,
      type: "SYSTEM",
      severity: "INFO",
      title: "Investigation created",
      message: `${incident.incidentId}: ${incident.title}`,
      relatedId: incident.id,
    }).catch(() => {});

    timelineService.publish({
      type: "INVESTIGATION_CREATED",
      actorId: input.createdBy,
      title: `Investigation ${incident.incidentId} created`,
      description: incident.title,
      severity: "info",
      relatedIncident: incident.id,
    }).catch(() => {});

    // Audit log
    this.audit(input.createdBy, "CREATE", "incident", incident.id, null, { title: input.title, priority: input.priority });

    return this.formatIncident(incident);
  },

  async list(filters: { status?: string; priority?: string; assignedTo?: string; page?: number; limit?: number }) {
    const { status, priority, assignedTo, page = 1, limit = 20 } = filters;
    const where: any = {};
    if (status && status !== "all" && status !== "undefined") where.status = status.toUpperCase();
    if (priority && priority !== "all" && priority !== "undefined") where.priority = priority.toUpperCase();
    if (assignedTo && assignedTo !== "undefined") where.assignedTo = assignedTo;

    const offset = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.incident.findMany({ where, orderBy: { updatedAt: "desc" }, take: limit, skip: offset, include: { officer: { include: { profile: true } }, creator: { include: { profile: true } } } }),
      prisma.incident.count({ where }),
    ]);

    return {
      items: items.map((i) => ({
        id: i.id,
        incidentId: i.incidentId,
        title: i.title,
        priority: i.priority.toLowerCase(),
        severity: i.severity,
        status: i.status.toLowerCase(),
        assignedOfficer: i.officer?.profile?.name || null,
        createdBy: i.creator?.profile?.name || "System",
        evidenceCount: i.evidenceCount,
        relatedReportIds: i.relatedReportIds,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      pagination: { total, page, limit },
    };
  },

  async getById(id: string) {
    const i = await prisma.incident.findUnique({
      where: { id },
      include: { officer: { include: { profile: true } }, creator: { include: { profile: true } }, timeline: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
    if (!i) return null;

    // Fetch linked reports
    let linkedReports: any[] = [];
    if (i.relatedReportIds.length > 0) {
      linkedReports = await prisma.threatReport.findMany({
        where: { id: { in: i.relatedReportIds } },
        select: { id: true, reportNumber: true, type: true, status: true, priority: true, description: true, createdAt: true, userId: true, scammerProfileId: true },
      });
    }

    // Fetch linked scammer profiles from reports
    const scammerProfileIds = [...new Set(linkedReports.map((r) => r.scammerProfileId).filter(Boolean))];
    let linkedScammers: any[] = [];
    if (scammerProfileIds.length > 0) {
      linkedScammers = await prisma.scammerProfile.findMany({
        where: { id: { in: scammerProfileIds } },
        select: { id: true, phones: true, emails: true, upiIds: true, threatLevel: true, occurrences: true, totalReports: true },
      });
    }

    // Fetch linked graph nodes
    let linkedNodes: any[] = [];
    if (i.relatedNodeIds.length > 0) {
      linkedNodes = await prisma.graphNode.findMany({
        where: { id: { in: i.relatedNodeIds } },
        select: { id: true, entityType: true, value: true, occurrences: true, riskLevel: true },
      });
    }

    return {
      id: i.id,
      incidentId: i.incidentId,
      title: i.title,
      description: i.description,
      priority: i.priority.toLowerCase(),
      severity: i.severity,
      status: i.status.toLowerCase(),
      assignedOfficer: i.officer ? { id: i.officer.id, name: i.officer.profile?.name, email: i.officer.email } : null,
      createdBy: { id: i.creator.id, name: i.creator.profile?.name },
      resolutionSummary: i.resolutionSummary,
      evidenceCount: i.evidenceCount,
      relatedReportIds: i.relatedReportIds,
      relatedScanIds: i.relatedScanIds,
      relatedNodeIds: i.relatedNodeIds,
      linkedReports: linkedReports.map((r) => ({
        id: r.id, reportNumber: r.reportNumber, type: r.type,
        status: r.status.toLowerCase(), priority: r.priority.toLowerCase(),
        description: r.description.slice(0, 100), createdAt: r.createdAt.toISOString(),
      })),
      linkedScammers: linkedScammers.map((s) => ({
        id: s.id, phones: s.phones, emails: s.emails, upiIds: s.upiIds,
        threatLevel: s.threatLevel.toLowerCase(), occurrences: s.occurrences, totalReports: s.totalReports,
      })),
      linkedNodes: linkedNodes.map((n) => ({
        id: n.id, type: n.entityType.toLowerCase(), value: n.value, occurrences: n.occurrences, riskLevel: n.riskLevel.toLowerCase(),
      })),
      timeline: i.timeline.map((e) => ({ id: e.id, type: e.eventType, description: e.description, actorId: e.actorId, timestamp: e.createdAt.toISOString() })),
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    };
  },

  async update(id: string, data: { title?: string; description?: string; priority?: string; severity?: string; resolutionSummary?: string }, actorId: string) {
    const before = await prisma.incident.findUnique({ where: { id } });
    if (!before) return null;

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.priority) updateData.priority = data.priority.toUpperCase();
    if (data.severity) updateData.severity = data.severity;
    if (data.resolutionSummary) updateData.resolutionSummary = data.resolutionSummary;

    const incident = await prisma.incident.update({ where: { id }, data: updateData });

    const changes: string[] = [];
    if (data.priority && data.priority.toUpperCase() !== before.priority) changes.push(`Priority: ${before.priority} → ${data.priority.toUpperCase()}`);
    if (data.title && data.title !== before.title) changes.push(`Title updated`);
    if (data.resolutionSummary) changes.push(`Resolution summary added`);

    await prisma.incidentEvent.create({ data: { incidentId: id, eventType: "UPDATED", description: changes.join("; ") || "Details updated", actorId } });

    this.audit(actorId, "UPDATE", "incident", id, { priority: before.priority, title: before.title }, updateData);

    return this.formatIncident(incident);
  },

  async updateStatus(id: string, newStatus: string, actorId: string) {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return null;

    const targetStatus = newStatus.toUpperCase() as IncidentStatus;
    const currentIdx = STATUS_ORDER.indexOf(incident.status);
    const targetIdx = STATUS_ORDER.indexOf(targetStatus);

    if (targetIdx < 0) throw new Error("Invalid status");
    if (targetIdx < currentIdx && targetStatus !== "ARCHIVED") throw new Error("Invalid status transition");

    const updated = await prisma.incident.update({ where: { id }, data: { status: targetStatus } });
    await prisma.incidentEvent.create({ data: { incidentId: id, eventType: "STATUS_CHANGED", description: `Status: ${incident.status} → ${targetStatus}`, actorId } });

    // Notify creator
    notificationService.create({
      userId: incident.createdBy,
      type: "REPORT_UPDATE",
      severity: targetStatus === "RESOLVED" ? "INFO" : "WARNING",
      title: `Investigation ${incident.incidentId} updated`,
      message: `Status changed to: ${targetStatus.toLowerCase().replace(/_/g, " ")}`,
      relatedId: id,
    }).catch(() => {});

    // Notify victims (citizens with linked reports)
    if (incident.relatedReportIds.length > 0) {
      this.notifyLinkedCitizens(incident.relatedReportIds, incident.incidentId, targetStatus).catch(() => {});
    }

    timelineService.publish({
      type: "INVESTIGATION_STATUS_CHANGE",
      actorId,
      title: `Investigation ${incident.incidentId}: ${targetStatus.toLowerCase().replace(/_/g, " ")}`,
      severity: targetStatus === "RESOLVED" ? "info" : "warning",
      relatedIncident: id,
    }).catch(() => {});

    this.audit(actorId, "STATUS_CHANGE", "incident", id, { status: incident.status }, { status: targetStatus });

    return this.formatIncident(updated);
  },

  async assign(id: string, officerId: string, actorId: string) {
    const before = await prisma.incident.findUnique({ where: { id } });
    if (!before) return null;

    const updated = await prisma.incident.update({ where: { id }, data: { assignedTo: officerId } });
    await prisma.incidentEvent.create({ data: { incidentId: id, eventType: "ASSIGNED", description: `Officer assigned`, actorId } });

    notificationService.create({
      userId: officerId,
      type: "SYSTEM",
      severity: "WARNING",
      title: "Investigation assigned",
      message: `You've been assigned to ${updated.incidentId}: ${updated.title}`,
      relatedId: id,
    }).catch(() => {});

    timelineService.publish({
      type: "OFFICER_ASSIGNED",
      actorId,
      title: `Officer assigned to ${updated.incidentId}`,
      severity: "info",
      relatedIncident: id,
    }).catch(() => {});

    this.audit(actorId, "ASSIGN", "incident", id, { assignedTo: before.assignedTo }, { assignedTo: officerId });

    return this.formatIncident(updated);
  },

  async addNote(id: string, content: string, actorId: string) {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return null;

    await prisma.incidentEvent.create({
      data: { incidentId: id, eventType: "NOTE_ADDED", description: content, actorId, metadata: { type: "internal_note" } },
    });

    this.audit(actorId, "ADD_NOTE", "incident", id, null, { note: content.slice(0, 100) });

    return { success: true };
  },

  async linkReport(id: string, reportId: string, actorId: string) {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return null;

    if (incident.relatedReportIds.includes(reportId)) return this.formatIncident(incident);

    const updated = await prisma.incident.update({
      where: { id },
      data: { relatedReportIds: { push: reportId } },
    });

    await prisma.incidentEvent.create({ data: { incidentId: id, eventType: "REPORT_LINKED", description: `Report linked to investigation`, actorId } });

    timelineService.publish({
      type: "INVESTIGATION_REPORT_LINKED",
      actorId,
      title: `Report linked to ${incident.incidentId}`,
      severity: "info",
      relatedIncident: id,
      relatedReport: reportId,
    }).catch(() => {});

    this.audit(actorId, "LINK_REPORT", "incident", id, null, { reportId });

    return this.formatIncident(updated);
  },

  async unlinkReport(id: string, reportId: string, actorId: string) {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return null;

    const filtered = incident.relatedReportIds.filter((r) => r !== reportId);
    const updated = await prisma.incident.update({ where: { id }, data: { relatedReportIds: filtered } });

    await prisma.incidentEvent.create({ data: { incidentId: id, eventType: "REPORT_UNLINKED", description: `Report unlinked from investigation`, actorId } });

    this.audit(actorId, "UNLINK_REPORT", "incident", id, null, { reportId });

    return this.formatIncident(updated);
  },

  async linkEvidence(id: string, nodeIds: string[], actorId: string) {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return null;

    const merged = [...new Set([...incident.relatedNodeIds, ...nodeIds])];
    const updated = await prisma.incident.update({
      where: { id },
      data: { relatedNodeIds: merged, evidenceCount: merged.length },
    });

    await prisma.incidentEvent.create({ data: { incidentId: id, eventType: "EVIDENCE_LINKED", description: `${nodeIds.length} evidence item(s) linked`, actorId } });

    this.audit(actorId, "LINK_EVIDENCE", "incident", id, null, { nodeIds });

    return this.formatIncident(updated);
  },

  async merge(targetId: string, sourceId: string, actorId: string) {
    const [target, source] = await Promise.all([
      prisma.incident.findUnique({ where: { id: targetId } }),
      prisma.incident.findUnique({ where: { id: sourceId } }),
    ]);
    if (!target || !source) throw new Error("Investigation not found");

    // Merge related IDs
    const mergedReports = [...new Set([...target.relatedReportIds, ...source.relatedReportIds])];
    const mergedScans = [...new Set([...target.relatedScanIds, ...source.relatedScanIds])];
    const mergedNodes = [...new Set([...target.relatedNodeIds, ...source.relatedNodeIds])];

    await prisma.incident.update({
      where: { id: targetId },
      data: {
        relatedReportIds: mergedReports,
        relatedScanIds: mergedScans,
        relatedNodeIds: mergedNodes,
        evidenceCount: mergedNodes.length,
        description: target.description
          ? `${target.description}\n\n--- Merged from ${source.incidentId} ---\n${source.description || ""}`
          : source.description || undefined,
      },
    });

    // Archive the source
    await prisma.incident.update({ where: { id: sourceId }, data: { status: "ARCHIVED" } });

    await prisma.incidentEvent.create({ data: { incidentId: targetId, eventType: "MERGED", description: `Merged with ${source.incidentId}`, actorId } });
    await prisma.incidentEvent.create({ data: { incidentId: sourceId, eventType: "MERGED_INTO", description: `Merged into ${target.incidentId}`, actorId } });

    timelineService.publish({
      type: "INVESTIGATION_MERGED",
      actorId,
      title: `${source.incidentId} merged into ${target.incidentId}`,
      severity: "info",
      relatedIncident: targetId,
    }).catch(() => {});

    this.audit(actorId, "MERGE", "incident", targetId, null, { mergedFrom: sourceId });

    return { success: true, targetId, sourceId };
  },

  async close(id: string, resolutionSummary: string, actorId: string) {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return null;

    const updated = await prisma.incident.update({
      where: { id },
      data: { status: "RESOLVED", resolutionSummary },
    });

    await prisma.incidentEvent.create({ data: { incidentId: id, eventType: "CLOSED", description: `Investigation resolved: ${resolutionSummary.slice(0, 100)}`, actorId } });

    // Notify linked citizens
    if (incident.relatedReportIds.length > 0) {
      this.notifyLinkedCitizens(incident.relatedReportIds, incident.incidentId, "RESOLVED", resolutionSummary).catch(() => {});
    }

    timelineService.publish({
      type: "INVESTIGATION_CLOSED",
      actorId,
      title: `Investigation ${incident.incidentId} resolved`,
      description: resolutionSummary.slice(0, 100),
      severity: "info",
      relatedIncident: id,
    }).catch(() => {});

    this.audit(actorId, "CLOSE", "incident", id, { status: incident.status }, { status: "RESOLVED", resolutionSummary });

    return this.formatIncident(updated);
  },

  async getTimeline(id: string) {
    return prisma.incidentEvent.findMany({ where: { incidentId: id }, orderBy: { createdAt: "desc" }, take: 50 });
  },

  async getStats() {
    const [total, newCount, investigating, resolved, critical] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: "NEW" } }),
      prisma.incident.count({ where: { status: "INVESTIGATING" } }),
      prisma.incident.count({ where: { status: "RESOLVED" } }),
      prisma.incident.count({ where: { priority: "CRITICAL" } }),
    ]);
    return { total, new: newCount, investigating, resolved, critical };
  },

  // ─── Helpers ──────────────────────────────────────────────────────

  async notifyLinkedCitizens(reportIds: string[], incidentId: string, status: string, message?: string) {
    const reports = await prisma.threatReport.findMany({
      where: { id: { in: reportIds } },
      select: { userId: true },
    });
    const citizenIds = [...new Set(reports.map((r) => r.userId))];

    for (const userId of citizenIds) {
      notificationService.create({
        userId,
        type: "REPORT_UPDATE",
        severity: status === "RESOLVED" ? "INFO" : "WARNING",
        title: `Investigation ${incidentId} update`,
        message: message || `Status: ${status.toLowerCase().replace(/_/g, " ")}`,
        relatedId: incidentId,
      }).catch(() => {});
    }
  },

  async audit(actorId: string, action: string, entity: string, entityId: string, before: any, after: any) {
    prisma.auditLog.create({
      data: { userId: actorId, action, entity, entityId, details: { before, after } },
    }).catch(() => {});
  },

  formatIncident(i: any) {
    return {
      id: i.id,
      incidentId: i.incidentId,
      title: i.title,
      priority: i.priority?.toLowerCase(),
      severity: i.severity,
      status: i.status?.toLowerCase(),
      createdAt: i.createdAt?.toISOString(),
      updatedAt: i.updatedAt?.toISOString(),
    };
  },
};
