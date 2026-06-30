import { prisma } from "../../config/database.js";

export const dashboardRepository = {
  async getOverview(userId: string) {
    const [total, safe, low, medium, high, critical] = await Promise.all([
      prisma.threatScan.count({ where: { userId } }),
      prisma.threatAnalysis.count({ where: { scan: { userId }, riskLevel: "SAFE" } }),
      prisma.threatAnalysis.count({ where: { scan: { userId }, riskLevel: "LOW" } }),
      prisma.threatAnalysis.count({ where: { scan: { userId }, riskLevel: "MEDIUM" } }),
      prisma.threatAnalysis.count({ where: { scan: { userId }, riskLevel: "HIGH" } }),
      prisma.threatAnalysis.count({ where: { scan: { userId }, riskLevel: "CRITICAL" } }),
    ]);

    const avgResult = await prisma.threatAnalysis.aggregate({
      where: { scan: { userId } },
      _avg: { riskScore: true },
    });

    return { total, safe, low, medium, high, critical, avgRiskScore: Math.round(avgResult._avg.riskScore || 0) };
  },

  async getRecentScans(userId: string, limit = 10) {
    return prisma.threatScan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { analysis: true },
    });
  },

  async getTimeline(userId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.threatScan.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      include: { analysis: true },
    });
  },

  async getNotifications(userId: string, limit = 10) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async computeSecurityScore(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalScans, safeScans, highRiskScans] = await Promise.all([
      prisma.threatScan.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.threatAnalysis.count({ where: { scan: { userId, createdAt: { gte: thirtyDaysAgo } }, riskLevel: { in: ["SAFE", "LOW"] } } }),
      prisma.threatAnalysis.count({ where: { scan: { userId, createdAt: { gte: thirtyDaysAgo } }, riskLevel: { in: ["HIGH", "CRITICAL"] } } }),
    ]);

    // Score: base 50, +engagement, +safe ratio, -high risk penalty
    let score = 50;
    if (totalScans > 0) {
      score += Math.min(20, totalScans * 3); // engagement bonus
      score += Math.round((safeScans / totalScans) * 20); // safe ratio bonus
      score -= Math.round((highRiskScans / totalScans) * 30); // high risk penalty
    }

    return Math.max(0, Math.min(100, score));
  },
};
