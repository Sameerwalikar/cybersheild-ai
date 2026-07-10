import { prisma } from "../../config/database.js";

export const dashboardRepository = {
  // Single aggregated query replacing 10 round trips
  async getOverviewAndScore(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    // One batched query for all risk level counts + avg using groupBy
    const [riskGroups, totalScans, avgResult, recentScans, recentHighRisk] = await Promise.all([
      prisma.threatAnalysis.groupBy({
        by: ["riskLevel"],
        where: { scan: { userId } },
        _count: { id: true },
      }),
      prisma.threatScan.count({ where: { userId } }),
      prisma.threatAnalysis.aggregate({
        where: { scan: { userId } },
        _avg: { riskScore: true },
      }),
      prisma.threatScan.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.threatAnalysis.count({
        where: { scan: { userId, createdAt: { gte: thirtyDaysAgo } }, riskLevel: { in: ["HIGH", "CRITICAL"] } },
      }),
    ]);

    // Map grouped results
    const counts: Record<string, number> = { SAFE: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const g of riskGroups) counts[g.riskLevel] = g._count.id;

    // Security score calculation (no extra DB round trips)
    let score = 50;
    if (recentScans > 0) {
      const safeCount = counts.SAFE + counts.LOW;
      const totalAnalyzed = Object.values(counts).reduce((a, b) => a + b, 0);
      score += Math.min(20, recentScans * 3);
      if (totalAnalyzed > 0) score += Math.round((safeCount / totalAnalyzed) * 20);
      score -= Math.round((recentHighRisk / recentScans) * 30);
    }

    return {
      total: totalScans,
      safe: counts.SAFE,
      low: counts.LOW,
      medium: counts.MEDIUM,
      high: counts.HIGH,
      critical: counts.CRITICAL,
      avgRiskScore: Math.round(avgResult._avg.riskScore || 0),
      securityScore: Math.max(0, Math.min(100, score)),
    };
  },

  async getRecentScans(userId: string, limit = 10) {
    return prisma.threatScan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { analysis: { select: { id: true, riskScore: true, riskLevel: true } } },
    });
  },

  // Use raw aggregation instead of fetching every row
  async getTimeline(userId: string, days = 7) {
    const since = new Date(Date.now() - days * 86400000);

    const rows = await prisma.$queryRaw<{ day: string; scans: bigint; threats: bigint; avg_risk: number }[]>`
      SELECT
        TO_CHAR(DATE(ts."createdAt"), 'YYYY-MM-DD') AS day,
        COUNT(ts.id)::bigint AS scans,
        COUNT(CASE WHEN ta."riskScore" >= 60 THEN 1 END)::bigint AS threats,
        COALESCE(AVG(ta."riskScore"), 0)::float AS avg_risk
      FROM threat_scans ts
      LEFT JOIN threat_analyses ta ON ta."scanId" = ts.id
      WHERE ts."userId" = ${userId}
        AND ts."createdAt" >= ${since}
      GROUP BY DATE(ts."createdAt")
      ORDER BY day ASC
    `;

    return rows.map((r) => ({
      date: String(r.day),
      scans: Number(r.scans),
      threats: Number(r.threats),
      avgRisk: Math.round(r.avg_risk),
    }));
  },

  async getNotificationsWithCount(userId: string, limit = 10) {
    // One query for both list and unread count
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, type: true, title: true, message: true, severity: true, isRead: true, createdAt: true },
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, unreadCount };
  },
};
