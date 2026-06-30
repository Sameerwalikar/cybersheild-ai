import { prisma } from "../../config/database.js";

interface SearchParams {
  query: string;
  filters?: {
    dateFrom?: string;
    threatLevel?: string;
    status?: string;
    category?: string;
    investigationStatus?: string;
  };
  limit?: number;
}

export const searchService = {
  async globalSearch(params: SearchParams) {
    const { query, filters, limit = 10 } = params;
    const q = query.trim();
    if (q.length < 2) return this.emptyResults();

    const qLower = q.toLowerCase();

    // Run all searches in parallel for performance
    const [investigations, reports, scammers, graphNodes, timeline, evidence] = await Promise.all([
      this.searchInvestigations(q, qLower, filters, limit),
      this.searchReports(q, qLower, filters, limit),
      this.searchScammers(qLower, limit),
      this.searchGraphNodes(qLower, limit),
      this.searchTimeline(q, qLower, limit),
      this.searchEvidence(qLower, limit),
    ]);

    return { investigations, reports, scammers, graphNodes, timeline, evidence };
  },

  async searchInvestigations(q: string, qLower: string, filters: any, limit: number) {
    const where: any = {
      OR: [
        { incidentId: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { resolutionSummary: { contains: q, mode: "insensitive" } },
      ],
    };

    if (filters?.investigationStatus) {
      where.status = filters.investigationStatus.toUpperCase();
    }

    const items = await prisma.incident.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: { officer: { include: { profile: true } } },
    });

    return items.map((i) => ({
      id: i.id,
      type: "investigation" as const,
      incidentId: i.incidentId,
      title: i.title,
      description: i.description?.slice(0, 100) || null,
      status: i.status.toLowerCase(),
      priority: i.priority.toLowerCase(),
      assignedOfficer: i.officer?.profile?.name || null,
      relatedReportIds: i.relatedReportIds,
      updatedAt: i.updatedAt.toISOString(),
    }));
  },

  async searchReports(q: string, qLower: string, filters: any, limit: number) {
    const where: any = {
      OR: [
        { reportNumber: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { type: { contains: q, mode: "insensitive" } },
        { aiSummary: { contains: q, mode: "insensitive" } },
      ],
    };

    if (filters?.status) where.status = filters.status.toUpperCase();
    if (filters?.category) where.type = { contains: filters.category, mode: "insensitive" };

    const items = await prisma.threatReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { include: { profile: true } } },
    });

    return items.map((r) => ({
      id: r.id,
      type: "report" as const,
      reportNumber: r.reportNumber,
      category: r.type,
      description: r.description.slice(0, 100),
      status: r.status.toLowerCase(),
      priority: r.priority.toLowerCase(),
      citizenName: r.user?.profile?.name || "Anonymous",
      scammerContact: r.scammerContact,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  async searchScammers(qLower: string, limit: number) {
    const items = await prisma.scammerProfile.findMany({
      where: {
        OR: [
          { phones: { has: qLower } },
          { phones: { hasSome: [qLower] } },
          { emails: { has: qLower } },
          { upiIds: { has: qLower } },
          { domains: { has: qLower } },
          { aliases: { has: qLower } },
        ],
      },
      orderBy: { occurrences: "desc" },
      take: limit,
    });

    // Also do a broader search with partial matching via raw query on arrays
    if (items.length === 0) {
      const broadItems = await prisma.$queryRaw<any[]>`
        SELECT * FROM scammer_profiles
        WHERE array_to_string(phones, ',') ILIKE ${'%' + qLower + '%'}
        OR array_to_string(emails, ',') ILIKE ${'%' + qLower + '%'}
        OR array_to_string("upiIds", ',') ILIKE ${'%' + qLower + '%'}
        OR array_to_string(domains, ',') ILIKE ${'%' + qLower + '%'}
        OR array_to_string(aliases, ',') ILIKE ${'%' + qLower + '%'}
        ORDER BY occurrences DESC
        LIMIT ${limit}
      `;
      return broadItems.map((s: any) => ({
        id: s.id,
        type: "scammer" as const,
        phones: s.phones || [],
        emails: s.emails || [],
        upiIds: s.upiIds || [],
        domains: s.domains || [],
        threatLevel: (s.threatLevel || "LOW").toLowerCase(),
        occurrences: s.occurrences || 1,
        totalReports: s.totalReports || 1,
        lastSeen: s.lastSeen?.toISOString?.() || new Date().toISOString(),
      }));
    }

    return items.map((s) => ({
      id: s.id,
      type: "scammer" as const,
      phones: s.phones,
      emails: s.emails,
      upiIds: s.upiIds,
      domains: s.domains,
      threatLevel: s.threatLevel.toLowerCase(),
      occurrences: s.occurrences,
      totalReports: s.totalReports,
      lastSeen: s.lastSeen.toISOString(),
    }));
  },

  async searchGraphNodes(qLower: string, limit: number) {
    const items = await prisma.graphNode.findMany({
      where: {
        OR: [
          { normalizedVal: { contains: qLower, mode: "insensitive" } },
          { value: { contains: qLower, mode: "insensitive" } },
        ],
      },
      orderBy: { occurrences: "desc" },
      take: limit,
    });

    return items.map((n) => ({
      id: n.id,
      type: "entity" as const,
      entityType: n.entityType.toLowerCase(),
      value: n.value,
      occurrences: n.occurrences,
      riskLevel: n.riskLevel.toLowerCase(),
      firstSeen: n.firstSeen.toISOString(),
      lastSeen: n.lastSeen.toISOString(),
    }));
  },

  async searchTimeline(q: string, qLower: string, limit: number) {
    const items = await prisma.timelineEvent.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return items.map((e) => ({
      id: e.id,
      type: "timeline" as const,
      eventType: e.type,
      title: e.title,
      description: e.description?.slice(0, 100) || null,
      severity: e.severity,
      timestamp: e.createdAt.toISOString(),
      relatedReport: e.relatedReport,
      relatedIncident: e.relatedIncident,
    }));
  },

  async searchEvidence(qLower: string, limit: number) {
    const items = await prisma.evidenceUpload.findMany({
      where: {
        OR: [
          { filename: { contains: qLower, mode: "insensitive" } },
          { visionSummary: { contains: qLower, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { include: { profile: true } } },
    });

    return items.map((e) => ({
      id: e.id,
      type: "evidence" as const,
      filename: e.filename,
      mimeType: e.mimeType,
      riskLevel: e.riskLevel?.toLowerCase() || "safe",
      riskScore: e.riskScore || 0,
      visionSummary: e.visionSummary?.slice(0, 100) || null,
      uploadedBy: e.user?.profile?.name || "Unknown",
      createdAt: e.createdAt.toISOString(),
    }));
  },

  emptyResults() {
    return { investigations: [], reports: [], scammers: [], graphNodes: [], timeline: [], evidence: [] };
  },
};
