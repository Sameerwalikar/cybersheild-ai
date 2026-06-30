import { prisma } from "../../config/database.js";
import type { ScanType, RiskLevel } from "@prisma/client";

interface HistoryQuery {
  userId: string;
  search?: string;
  riskLevel?: string;
  scanType?: string;
  dateRange?: "today" | "7d" | "30d";
  sortBy?: "newest" | "oldest" | "risk_high" | "risk_low";
  cursor?: string;
  limit?: number;
}

export const historyRepository = {
  async findMany(query: HistoryQuery) {
    const { userId, search, riskLevel, scanType, dateRange, sortBy = "newest", cursor, limit = 20 } = query;

    const where: any = { userId };

    // Date filter
    if (dateRange) {
      const now = new Date();
      if (dateRange === "today") {
        where.createdAt = { gte: new Date(now.setHours(0, 0, 0, 0)) };
      } else if (dateRange === "7d") {
        where.createdAt = { gte: new Date(Date.now() - 7 * 86400000) };
      } else if (dateRange === "30d") {
        where.createdAt = { gte: new Date(Date.now() - 30 * 86400000) };
      }
    }

    // Scan type filter
    if (scanType && scanType !== "all") {
      where.scanType = scanType.toUpperCase() as ScanType;
    }

    // Search
    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }

    // Risk level filter (on analysis relation)
    const analysisWhere: any = {};
    if (riskLevel && riskLevel !== "all") {
      analysisWhere.riskLevel = riskLevel.toUpperCase() as RiskLevel;
    }

    // Sort
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    if (sortBy === "risk_high") orderBy = { analysis: { riskScore: "desc" } };
    if (sortBy === "risk_low") orderBy = { analysis: { riskScore: "asc" } };

    // Cursor pagination
    const cursorObj = cursor ? { id: cursor } : undefined;

    const items = await prisma.threatScan.findMany({
      where: {
        ...where,
        analysis: Object.keys(analysisWhere).length > 0 ? analysisWhere : undefined,
      },
      orderBy,
      take: limit + 1,
      ...(cursorObj ? { cursor: cursorObj, skip: 1 } : {}),
      include: { analysis: { include: { indicators: true } } },
    });

    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    return { items: results, hasMore, nextCursor };
  },

  async findById(id: string, userId: string) {
    return prisma.threatScan.findFirst({
      where: { id, userId },
      include: { analysis: { include: { indicators: true, riskScores: true } } },
    });
  },

  async getTrends(userId: string) {
    const weekAgo = new Date(Date.now() - 7 * 86400000);

    const [weeklyCount, highestRisk, recentAnalyses] = await Promise.all([
      prisma.threatScan.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      prisma.threatAnalysis.findFirst({
        where: { scan: { userId } },
        orderBy: { riskScore: "desc" },
        include: { scan: true },
      }),
      prisma.threatAnalysis.findMany({
        where: { scan: { userId, createdAt: { gte: weekAgo } } },
        select: { riskLevel: true },
      }),
    ]);

    // Most common threat level
    const counts: Record<string, number> = {};
    recentAnalyses.forEach((a) => { counts[a.riskLevel] = (counts[a.riskLevel] || 0) + 1; });
    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    return {
      weeklyScans: weeklyCount,
      highestRiskScore: highestRisk?.riskScore || 0,
      highestRiskType: highestRisk?.scan?.scanType.toLowerCase() || null,
      mostCommonThreat: mostCommon ? mostCommon[0].toLowerCase() : "none",
    };
  },

  async getTotal(userId: string) {
    return prisma.threatScan.count({ where: { userId } });
  },
};
