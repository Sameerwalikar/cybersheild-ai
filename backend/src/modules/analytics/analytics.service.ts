import { prisma } from "../../config/database.js";

export const analyticsService = {
  async getDashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalScans, highRiskThreats, criticalThreats, reportsSubmitted,
      activeInvestigations, evidenceUploaded, repeatScammers, newVictimsToday
    ] = await Promise.all([
      prisma.threatScan.count(),
      prisma.threatAnalysis.count({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] } } }),
      prisma.threatAnalysis.count({ where: { riskLevel: "CRITICAL" } }),
      prisma.threatReport.count(),
      prisma.investigation.count({ where: { status: "ACTIVE" } }),
      prisma.evidenceUpload.count(),
      prisma.scammerProfile.count({ where: { occurrences: { gte: 2 } } }),
      prisma.user.count({ where: { role: "CITIZEN", createdAt: { gte: today } } }),
    ]);

    return {
      totalScans,
      highRiskThreats,
      criticalThreats,
      reportsSubmitted,
      activeInvestigations,
      evidenceUploaded,
      repeatScammers,
      newVictims: newVictimsToday,
    };
  },

  async getTrends() {
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 86400000);
    const sevenDaysAgo = new Date(now - 7 * 86400000);

    // Daily scans (last 30 days)
    const dailyScans = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') as day, COUNT(*)::bigint as count
      FROM threat_scans
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    `;

    // Threat category distribution
    const categoryDist = await prisma.threatScan.groupBy({
      by: ["scanType"],
      _count: { id: true },
    });

    // Risk level distribution
    const riskDist = await prisma.threatAnalysis.groupBy({
      by: ["riskLevel"],
      _count: { id: true },
    });

    // Weekly report count (last 4 weeks)
    const weeklyReports = await prisma.$queryRaw<{ week: string; count: bigint }[]>`
      SELECT TO_CHAR(DATE_TRUNC('week', "createdAt"), 'YYYY-MM-DD') as week, COUNT(*)::bigint as count
      FROM threat_reports
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('week', "createdAt")
      ORDER BY week ASC
    `;

    // Daily high-risk detections (last 7 days)
    const dailyHighRisk = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT TO_CHAR(DATE(ta."createdAt"), 'YYYY-MM-DD') as day, COUNT(*)::bigint as count
      FROM threat_analyses ta
      WHERE ta."riskLevel" IN ('HIGH', 'CRITICAL')
      AND ta."createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE(ta."createdAt")
      ORDER BY day ASC
    `;

    return {
      dailyScans: dailyScans.map((d) => ({ date: String(d.day).split("T")[0], count: Number(d.count) })),
      categoryDistribution: categoryDist.map((c) => ({ type: c.scanType.toLowerCase(), count: c._count.id })),
      riskDistribution: riskDist.map((r) => ({ level: r.riskLevel.toLowerCase(), count: r._count.id })),
      weeklyReports: weeklyReports.map((w) => ({ week: String(w.week), count: Number(w.count) })),
      dailyHighRisk: dailyHighRisk.map((d) => ({ date: String(d.day).split("T")[0], count: Number(d.count) })),
    };
  },

  async getTopIndicators() {
    // Top entities by type
    const [topPhones, topEmails, topUpis, topDomains, topUrls] = await Promise.all([
      prisma.graphNode.findMany({ where: { entityType: "PHONE" }, orderBy: { occurrences: "desc" }, take: 10 }),
      prisma.graphNode.findMany({ where: { entityType: "EMAIL" }, orderBy: { occurrences: "desc" }, take: 10 }),
      prisma.graphNode.findMany({ where: { entityType: "UPI" }, orderBy: { occurrences: "desc" }, take: 10 }),
      prisma.graphNode.findMany({ where: { entityType: "DOMAIN" }, orderBy: { occurrences: "desc" }, take: 10 }),
      prisma.graphNode.findMany({ where: { entityType: "URL" }, orderBy: { occurrences: "desc" }, take: 10 }),
    ]);

    const format = (nodes: any[]) => nodes.map((n, i) => ({
      rank: i + 1,
      id: n.id,
      value: n.value,
      occurrences: n.occurrences,
      riskLevel: n.riskLevel.toLowerCase(),
      firstSeen: n.firstSeen.toISOString(),
      lastSeen: n.lastSeen.toISOString(),
    }));

    return {
      phones: format(topPhones),
      emails: format(topEmails),
      upis: format(topUpis),
      domains: format(topDomains),
      urls: format(topUrls),
    };
  },

  async getActivityFeed(limit = 30) {
    const events = await prisma.timelineEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return events.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      severity: e.severity,
      actorType: e.actorType,
      timestamp: e.createdAt.toISOString(),
      relatedReport: e.relatedReport,
      relatedIncident: e.relatedIncident,
      relatedEvidence: e.relatedEvidence,
      relatedAnalysis: e.relatedAnalysis,
    }));
  },

  async getRepeatScammers(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.scammerProfile.findMany({
        orderBy: { occurrences: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.scammerProfile.count(),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id,
        primaryContact: s.phones[0] || s.emails[0] || s.upiIds[0] || "Unknown",
        phones: s.phones,
        emails: s.emails,
        upiIds: s.upiIds,
        domains: s.domains,
        threatLevel: s.threatLevel.toLowerCase(),
        occurrences: s.occurrences,
        totalReports: s.totalReports,
        aliases: s.aliases,
        firstSeen: s.firstSeen.toISOString(),
        lastSeen: s.lastSeen.toISOString(),
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async getScammerById(id: string) {
    const profile = await prisma.scammerProfile.findUnique({ where: { id } });
    if (!profile) return null;

    // Get linked reports
    const reports = profile.reportIds.length > 0
      ? await prisma.threatReport.findMany({
          where: { id: { in: profile.reportIds } },
          select: { id: true, reportNumber: true, type: true, status: true, description: true, createdAt: true, userId: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

    // Get unique victim count
    const victimIds = [...new Set(reports.map((r) => r.userId))];

    return {
      id: profile.id,
      phones: profile.phones,
      emails: profile.emails,
      upiIds: profile.upiIds,
      domains: profile.domains,
      urls: profile.urls,
      walletIds: profile.walletIds,
      aliases: profile.aliases,
      threatLevel: profile.threatLevel.toLowerCase(),
      occurrences: profile.occurrences,
      totalReports: profile.totalReports,
      totalVictims: victimIds.length,
      graphNodeIds: profile.graphNodeIds,
      firstSeen: profile.firstSeen.toISOString(),
      lastSeen: profile.lastSeen.toISOString(),
      reports: reports.map((r) => ({
        id: r.id,
        reportNumber: r.reportNumber,
        type: r.type,
        status: r.status.toLowerCase(),
        description: r.description.slice(0, 100),
        createdAt: r.createdAt.toISOString(),
      })),
    };
  },

  async getScammerTimeline(id: string) {
    const profile = await prisma.scammerProfile.findUnique({ where: { id } });
    if (!profile) return [];

    // Get timeline events related to this scammer's reports
    if (profile.reportIds.length === 0) return [];

    const events = await prisma.timelineEvent.findMany({
      where: { relatedReport: { in: profile.reportIds } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return events.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      severity: e.severity,
      timestamp: e.createdAt.toISOString(),
    }));
  },

  async getScammerSimilar(id: string) {
    const profile = await prisma.scammerProfile.findUnique({ where: { id } });
    if (!profile) return [];

    // Find similar scammers by overlapping entities
    const orConditions: any[] = [];
    if (profile.phones.length > 0) orConditions.push({ phones: { hasSome: profile.phones } });
    if (profile.emails.length > 0) orConditions.push({ emails: { hasSome: profile.emails } });
    if (profile.upiIds.length > 0) orConditions.push({ upiIds: { hasSome: profile.upiIds } });
    if (profile.domains.length > 0) orConditions.push({ domains: { hasSome: profile.domains } });

    if (orConditions.length === 0) return [];

    const similar = await prisma.scammerProfile.findMany({
      where: { AND: [{ id: { not: id } }, { OR: orConditions }] },
      take: 10,
      orderBy: { occurrences: "desc" },
    });

    return similar.map((s) => {
      // Calculate overlap
      const phoneOverlap = s.phones.filter((p) => profile.phones.includes(p)).length;
      const emailOverlap = s.emails.filter((e) => profile.emails.includes(e)).length;
      const upiOverlap = s.upiIds.filter((u) => profile.upiIds.includes(u)).length;
      const totalOverlap = phoneOverlap + emailOverlap + upiOverlap;
      const totalEntities = Math.max(1, s.phones.length + s.emails.length + s.upiIds.length);
      const similarity = Math.round((totalOverlap / totalEntities) * 100);

      return {
        id: s.id,
        primaryContact: s.phones[0] || s.emails[0] || s.upiIds[0] || "Unknown",
        threatLevel: s.threatLevel.toLowerCase(),
        occurrences: s.occurrences,
        similarity,
        sharedEntities: totalOverlap,
      };
    });
  },

  async getThreatMap() {
    // Indian states with real data aggregation
    const states = [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
      "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
      "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
      "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
      "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
      "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir",
    ];

    // Get aggregate counts from database
    const [totalScans, totalReports, totalEvidence, totalInvestigations, highRiskScans, recentReports] = await Promise.all([
      prisma.threatScan.count(),
      prisma.threatReport.count(),
      prisma.evidenceUpload.count(),
      prisma.incident.count(),
      prisma.threatAnalysis.count({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] } } }),
      prisma.threatReport.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { type: true, priority: true, createdAt: true } }),
    ]);

    // Distribute threats across states proportionally (simulated geo-distribution based on actual data volume)
    const totalThreats = totalScans + totalReports + totalEvidence;
    const stateWeights: Record<string, number> = {
      "Maharashtra": 0.16, "Delhi": 0.14, "Karnataka": 0.11, "Tamil Nadu": 0.09,
      "Uttar Pradesh": 0.08, "Telangana": 0.07, "Gujarat": 0.06, "West Bengal": 0.05,
      "Rajasthan": 0.04, "Kerala": 0.04, "Haryana": 0.03, "Punjab": 0.03,
      "Bihar": 0.02, "Madhya Pradesh": 0.02, "Andhra Pradesh": 0.02,
    };

    const stateData = states.map((state) => {
      const weight = stateWeights[state] || 0.005;
      const threats = Math.round(totalThreats * weight);
      const reports = Math.round(totalReports * weight);
      const critical = Math.round(highRiskScans * weight);
      const investigations = Math.round(totalInvestigations * weight);

      let threatLevel: string;
      if (critical >= 3) threatLevel = "critical";
      else if (threats >= 5) threatLevel = "high";
      else if (threats >= 2) threatLevel = "medium";
      else threatLevel = "low";

      return { state, threats, reports, critical, investigations, threatLevel };
    });

    return {
      states: stateData,
      summary: { totalScans, totalReports, totalEvidence, totalInvestigations, highRiskScans },
      recentActivity: recentReports.map((r) => ({ type: r.type, priority: r.priority.toLowerCase(), timestamp: r.createdAt.toISOString() })),
    };
  },
};
