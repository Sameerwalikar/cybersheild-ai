import { historyRepository } from "./history.repository.js";

interface HistoryParams {
  userId: string;
  search?: string;
  riskLevel?: string;
  scanType?: string;
  dateRange?: "today" | "7d" | "30d";
  sortBy?: "newest" | "oldest" | "risk_high" | "risk_low";
  cursor?: string;
  limit?: number;
}

export const historyService = {
  async getHistory(params: HistoryParams) {
    const { items, hasMore, nextCursor } = await historyRepository.findMany(params);
    const total = await historyRepository.getTotal(params.userId);

    return {
      items: items.map((scan) => ({
        id: scan.id,
        scanType: scan.scanType.toLowerCase(),
        content: scan.content.slice(0, 120),
        riskScore: scan.analysis?.riskScore || 0,
        riskLevel: (scan.analysis?.riskLevel || "SAFE").toLowerCase(),
        summary: scan.analysis?.summary || "",
        recommendation: scan.analysis?.recommendation || "",
        signals: scan.analysis?.indicators.map((i) => ({
          label: i.label,
          severity: i.severity.toLowerCase(),
          confidence: i.confidence,
          description: i.description,
        })) || [],
        timestamp: scan.createdAt.toISOString(),
        status: scan.status.toLowerCase(),
      })),
      pagination: { total, hasMore, nextCursor },
    };
  },

  async getDetail(id: string, userId: string) {
    const scan = await historyRepository.findById(id, userId);
    if (!scan) return null;

    return {
      id: scan.id,
      scanType: scan.scanType.toLowerCase(),
      content: scan.content,
      riskScore: scan.analysis?.riskScore || 0,
      riskLevel: (scan.analysis?.riskLevel || "SAFE").toLowerCase(),
      summary: scan.analysis?.summary || "",
      recommendation: scan.analysis?.recommendation || "",
      confidence: scan.analysis?.confidence || 0,
      processingTime: scan.analysis?.processingTime || 0,
      signals: scan.analysis?.indicators.map((i) => ({
        label: i.label,
        severity: i.severity.toLowerCase(),
        confidence: i.confidence,
        description: i.description,
      })) || [],
      riskBreakdown: scan.analysis?.riskScores ? {
        overall: scan.analysis.riskScores.overall,
        content: scan.analysis.riskScores.contentRisk,
        source: scan.analysis.riskScores.sourceRisk,
        pattern: scan.analysis.riskScores.patternRisk,
        community: scan.analysis.riskScores.communityRisk,
      } : null,
      timestamp: scan.createdAt.toISOString(),
      status: scan.status.toLowerCase(),
    };
  },

  async getTrends(userId: string) {
    return historyRepository.getTrends(userId);
  },

  async exportHistory(params: HistoryParams) {
    // Fetch all matching without cursor limit for export
    const { items } = await historyRepository.findMany({ ...params, limit: 500 });
    return items.map((scan) => ({
      id: scan.id,
      scanType: scan.scanType,
      content: scan.content,
      riskScore: scan.analysis?.riskScore || 0,
      riskLevel: scan.analysis?.riskLevel || "SAFE",
      summary: scan.analysis?.summary || "",
      timestamp: scan.createdAt.toISOString(),
    }));
  },
};
