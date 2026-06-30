import { dashboardRepository } from "./dashboard.repository.js";
import { aiService } from "../ai/index.js";

export const dashboardService = {
  async getOverview(userId: string) {
    const stats = await dashboardRepository.getOverview(userId);
    const securityScore = await dashboardRepository.computeSecurityScore(userId);
    return { ...stats, securityScore };
  },

  async getHistory(userId: string) {
    const scans = await dashboardRepository.getRecentScans(userId);
    return scans.map((scan) => ({
      id: scan.analysis?.id || scan.id,
      scanType: scan.scanType.toLowerCase(),
      content: scan.content.slice(0, 80),
      riskScore: scan.analysis?.riskScore || 0,
      riskLevel: (scan.analysis?.riskLevel || "SAFE").toLowerCase(),
      timestamp: scan.createdAt.toISOString(),
    }));
  },

  async getTimeline(userId: string, days: number) {
    const scans = await dashboardRepository.getTimeline(userId, days);

    // Group by date
    const grouped: Record<string, { date: string; scans: number; threats: number; avgRisk: number }> = {};

    for (const scan of scans) {
      const date = scan.createdAt.toISOString().split("T")[0];
      if (!grouped[date]) grouped[date] = { date, scans: 0, threats: 0, avgRisk: 0 };
      grouped[date].scans++;
      const risk = scan.analysis?.riskScore || 0;
      grouped[date].avgRisk += risk;
      if (risk >= 60) grouped[date].threats++;
    }

    return Object.values(grouped).map((d) => ({
      ...d,
      avgRisk: d.scans > 0 ? Math.round(d.avgRisk / d.scans) : 0,
    }));
  },

  async getInsights(userId: string) {
    const scans = await dashboardRepository.getRecentScans(userId, 5);
    if (scans.length === 0) {
      return { summary: "Start scanning messages, URLs, or UPI IDs to get AI-powered insights about your cyber safety.", recommendations: ["Scan a suspicious SMS", "Check a URL before clicking", "Verify unknown UPI IDs"] };
    }

    // Build context from recent scans
    const recentSignals = scans
      .filter((s) => s.analysis && s.analysis.riskScore >= 40)
      .map((s) => `${s.scanType} scan (risk: ${s.analysis!.riskScore}): ${s.content.slice(0, 50)}`)
      .join("; ");

    let summary: string;
    let recommendations: string[];

    try {
      const context = {
        scanType: "message" as const,
        content: recentSignals || "recent activity",
        riskScore: scans[0]?.analysis?.riskScore || 0,
        riskLevel: (scans[0]?.analysis?.riskLevel || "SAFE").toLowerCase(),
        signals: [],
      };
      summary = await aiService.summarizeThreat(context);
      recommendations = [
        "Review flagged content carefully",
        "Block senders of high-risk messages",
        "Report confirmed scams to cybercrime.gov.in",
      ];
    } catch {
      summary = `You've completed ${scans.length} recent scans. ${scans.filter((s) => s.analysis && s.analysis.riskScore >= 60).length} showed elevated risk.`;
      recommendations = ["Stay vigilant", "Continue scanning suspicious content", "Report confirmed threats"];
    }

    return { summary, recommendations };
  },

  async getNotifications(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      dashboardRepository.getNotifications(userId),
      dashboardRepository.getUnreadCount(userId),
    ]);
    return {
      items: notifications.map((n) => ({
        id: n.id,
        type: n.type.toLowerCase(),
        title: n.title,
        message: n.message,
        severity: n.severity.toLowerCase(),
        isRead: n.isRead,
        timestamp: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  },
};
