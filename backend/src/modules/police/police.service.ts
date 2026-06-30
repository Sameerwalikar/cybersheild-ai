import { prisma } from "../../config/database.js";

export const policeService = {
  async getDashboard() {
    const [
      totalInvestigations, activeInvestigations, totalNetworks, totalEvidence, recentScansCount, threatsByCity,
      recentInvestigations, recentAnalyses, recentReports, criticalNotifications, recentIncidents, topThreats, recentNetworks,
      reportStats, topScammers
    ] = await Promise.all([
      prisma.investigation.count(),
      prisma.investigation.count({ where: { status: "ACTIVE" } }),
      prisma.fraudNetwork.count(),
      prisma.evidence.count(),
      prisma.threatScan.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.investigation.groupBy({ by: ["city"], _count: { id: true }, where: { city: { not: null } } }),
      // Recent investigations
      prisma.investigation.findMany({ orderBy: { updatedAt: "desc" }, take: 10, include: { network: true } }),
      // Recent threat analyses (high risk)
      prisma.threatAnalysis.findMany({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] } }, orderBy: { createdAt: "desc" }, take: 10, include: { scan: true } }),
      // Recent citizen reports (investigation queue)
      prisma.threatReport.findMany({
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 15,
        include: { user: { include: { profile: true } } },
      }),
      // Critical notifications
      prisma.notification.findMany({ where: { severity: "CRITICAL", isRead: false }, orderBy: { createdAt: "desc" }, take: 5 }),
      // Recent incidents
      prisma.incident.findMany({ orderBy: { updatedAt: "desc" }, take: 8 }),
      // Top scan types (threat categories)
      prisma.threatScan.groupBy({ by: ["scanType"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
      // Recent fraud networks
      prisma.fraudNetwork.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
      // Report statistics
      prisma.threatReport.groupBy({ by: ["status"], _count: { id: true } }),
      // Top scammer profiles
      prisma.scammerProfile.findMany({ orderBy: { occurrences: "desc" }, take: 5 }),
    ]);

    const reportStatsMap: Record<string, number> = {};
    reportStats.forEach((r) => { reportStatsMap[r.status.toLowerCase()] = r._count.id; });

    return {
      stats: {
        totalInvestigations,
        activeInvestigations,
        totalNetworks,
        totalEvidence,
        threatsToday: recentScansCount,
        totalReports: Object.values(reportStatsMap).reduce((a, b) => a + b, 0),
        pendingReports: (reportStatsMap["submitted"] || 0) + (reportStatsMap["under_review"] || 0),
      },
      cityBreakdown: threatsByCity.map((c) => ({ city: c.city, count: c._count.id })),
      recentInvestigations: recentInvestigations.map((inv) => ({
        id: inv.id, caseId: inv.caseId, title: inv.title, status: inv.status.toLowerCase(),
        confidence: inv.confidence, city: inv.city, networkName: inv.network?.name || null,
        updatedAt: inv.updatedAt.toISOString(),
      })),
      recentAnalyses: recentAnalyses.map((a) => ({
        id: a.id, riskScore: a.riskScore, riskLevel: a.riskLevel.toLowerCase(),
        summary: a.summary.slice(0, 80), scanType: a.scan?.scanType.toLowerCase() || "unknown",
        createdAt: a.createdAt.toISOString(),
      })),
      recentReports: recentReports.map((r) => ({
        id: r.id, reportNumber: r.reportNumber, type: r.type,
        status: r.status.toLowerCase(), priority: r.priority.toLowerCase(),
        citizenName: r.user?.profile?.name || "Anonymous",
        description: r.description.slice(0, 80),
        aiSummary: r.aiSummary?.slice(0, 100) || null,
        createdAt: r.createdAt.toISOString(),
      })),
      criticalNotifications: criticalNotifications.map((n) => ({
        id: n.id, title: n.title, message: n.message, timestamp: n.createdAt.toISOString(),
      })),
      recentIncidents: recentIncidents.map((i) => ({
        id: i.id, incidentId: i.incidentId, title: i.title,
        status: i.status.toLowerCase(), priority: i.priority.toLowerCase(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      topThreatCategories: topThreats.map((t) => ({ type: t.scanType.toLowerCase(), count: t._count.id })),
      recentNetworks: recentNetworks.map((n) => ({
        id: n.id, name: n.name, cities: n.cities, nodeCount: n.nodeCount, status: n.status,
      })),
      reportStatsBreakdown: reportStatsMap,
      repeatScammers: topScammers.map((s) => ({
        id: s.id,
        primaryContact: s.phones[0] || s.emails[0] || s.upiIds[0] || "Unknown",
        type: s.phones.length > 0 ? "phone" : s.emails.length > 0 ? "email" : "upi",
        occurrences: s.occurrences,
        totalReports: s.totalReports,
        threatLevel: s.threatLevel.toLowerCase(),
      })),
    };
  },

  async getInvestigations(status?: string, page = 1, limit = 20) {
    const where: any = {};
    if (status && status !== "all") where.status = status.toUpperCase();
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.investigation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
        include: { evidence: { take: 5 }, network: true },
      }),
      prisma.investigation.count({ where }),
    ]);

    return {
      items: items.map((inv) => ({
        id: inv.id,
        caseId: inv.caseId,
        title: inv.title,
        description: inv.description,
        status: inv.status.toLowerCase(),
        confidence: inv.confidence,
        city: inv.city,
        evidenceCount: inv.evidence.length,
        networkName: inv.network?.name || null,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      })),
      pagination: { total, page, limit },
    };
  },

  async getInvestigation(id: string) {
    const inv = await prisma.investigation.findUnique({
      where: { id },
      include: { evidence: true, network: true, report: true },
    });
    if (!inv) return null;

    return {
      id: inv.id,
      caseId: inv.caseId,
      title: inv.title,
      description: inv.description,
      status: inv.status.toLowerCase(),
      confidence: inv.confidence,
      city: inv.city,
      network: inv.network ? { id: inv.network.id, name: inv.network.name, cities: inv.network.cities, nodeCount: inv.network.nodeCount } : null,
      evidence: inv.evidence.map((e) => ({ id: e.id, type: e.type.toLowerCase(), value: e.value, description: e.description })),
      report: inv.report ? { id: inv.report.id, reportNumber: inv.report.reportNumber, type: inv.report.type } : null,
      createdAt: inv.createdAt.toISOString(),
    };
  },

  async getFraudNetworks(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.fraudNetwork.findMany({ orderBy: { updatedAt: "desc" }, take: limit, skip: offset, include: { _count: { select: { investigations: true, evidence: true } } } }),
      prisma.fraudNetwork.count(),
    ]);

    return {
      items: items.map((n) => ({
        id: n.id,
        name: n.name,
        cities: n.cities,
        confidence: n.confidence,
        nodeCount: n.nodeCount,
        edgeCount: n.edgeCount,
        status: n.status,
        investigations: n._count.investigations,
        evidenceCount: n._count.evidence,
      })),
      pagination: { total, page, limit },
    };
  },

  async getAnalytics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [totalScans, highRiskScans, scansByType, dailyScans] = await Promise.all([
      prisma.threatScan.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.threatAnalysis.count({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] }, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.threatScan.groupBy({ by: ["scanType"], _count: { id: true }, where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.threatScan.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return {
      totalScans,
      highRiskScans,
      scansByType: scansByType.map((s) => ({ type: s.scanType.toLowerCase(), count: s._count.id })),
      dailyActivity: dailyScans.map((d) => ({ date: d.createdAt.toISOString().split("T")[0], count: d._count.id })),
    };
  },
};
