import { dashboardRepository } from "./dashboard.repository.js";
import { aiService } from "../ai/index.js";

// ─── Simple in-memory TTL cache ────────────────────────────────────────────
interface CacheEntry<T> { data: T; expiresAt: number; }
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data;
}

function setCached<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  // Prune old entries occasionally to avoid unbounded growth
  if (cache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) { if (now > v.expiresAt) cache.delete(k); }
  }
}

// ─── Dashboard service ─────────────────────────────────────────────────────

export const dashboardService = {
  // Merged overview + score: 5 queries → 1 batched call, cached 30s
  async getOverview(userId: string) {
    const key = `overview:${userId}`;
    const cached = getCached<object>(key);
    if (cached) return cached;

    const data = await dashboardRepository.getOverviewAndScore(userId);
    setCached(key, data, 30_000); // 30 second cache
    return data;
  },

  // History: cached 20s
  async getHistory(userId: string) {
    const key = `history:${userId}`;
    const cached = getCached<unknown[]>(key);
    if (cached) return cached;

    const scans = await dashboardRepository.getRecentScans(userId);
    const data = scans.map((scan) => ({
      id: scan.analysis?.id || scan.id,
      scanType: scan.scanType.toLowerCase(),
      content: scan.content.slice(0, 80),
      riskScore: scan.analysis?.riskScore || 0,
      riskLevel: (scan.analysis?.riskLevel || "SAFE").toLowerCase(),
      timestamp: scan.createdAt.toISOString(),
    }));

    setCached(key, data, 20_000);
    return data;
  },

  // Timeline: aggregated SQL query, cached 60s
  async getTimeline(userId: string, days: number) {
    const key = `timeline:${userId}:${days}`;
    const cached = getCached<unknown[]>(key);
    if (cached) return cached;

    const data = await dashboardRepository.getTimeline(userId, days);
    setCached(key, data, 60_000);
    return data;
  },

  // Insights: NEVER blocks page load.
  // Returns rule-based result instantly (<5ms).
  // Fires AI enrichment in background; next request within 5min gets the AI version.
  async getInsights(userId: string) {
    const key = `insights:${userId}`;
    const cached = getCached<object>(key);
    if (cached) return cached;

    // Build instant rule-based insights from recent scans
    const scans = await dashboardRepository.getRecentScans(userId, 5);
    const ruleBasedInsights = buildRuleBasedInsights(scans);

    // Cache the rule-based version immediately (short TTL)
    setCached(key, ruleBasedInsights, 120_000); // 2 min while AI runs

    // Fire AI enrichment in the background — don't await
    if (scans.length > 0) {
      enrichInsightsWithAI(userId, scans, key).catch(() => {});
    }

    return ruleBasedInsights;
  },

  // Notifications: single batched query, cached 15s
  async getNotifications(userId: string) {
    const key = `notifs:${userId}`;
    const cached = getCached<object>(key);
    if (cached) return cached;

    const { items, unreadCount } = await dashboardRepository.getNotificationsWithCount(userId);
    const data = {
      items: items.map((n) => ({
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

    setCached(key, data, 15_000);
    return data;
  },

  // Call this after any scan/notification to invalidate stale cache
  invalidateUser(userId: string) {
    for (const key of ["overview", "history", "timeline:7", "notifs", "insights"]) {
      cache.delete(`${key}:${userId}`);
      cache.delete(`${key === "timeline:7" ? "timeline" : key}:${userId}:7`);
    }
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function buildRuleBasedInsights(scans: any[]) {
  if (scans.length === 0) {
    return {
      summary: "Start scanning messages, URLs, or UPI IDs to get AI-powered insights about your cyber safety.",
      recommendations: [
        "Scan a suspicious SMS or WhatsApp message",
        "Check a URL before clicking",
        "Verify unknown UPI IDs before sending money",
      ],
    };
  }

  const highRisk = scans.filter((s) => s.analysis && s.analysis.riskScore >= 60);
  const scanTypes = [...new Set(scans.map((s) => s.scanType.toLowerCase()))];
  const avgScore = Math.round(scans.reduce((a, s) => a + (s.analysis?.riskScore || 0), 0) / scans.length);

  let summary: string;
  if (highRisk.length > 0) {
    summary = `${highRisk.length} of your ${scans.length} recent scans showed elevated risk (avg score: ${avgScore}/100). Stay cautious.`;
  } else {
    summary = `Your last ${scans.length} scans look safe (avg risk: ${avgScore}/100). Keep scanning regularly.`;
  }

  const recs: string[] = [];
  if (highRisk.length > 0) recs.push("Block or ignore sources of high-risk content immediately");
  if (scanTypes.includes("url")) recs.push("Double-check domains before entering credentials");
  if (scanTypes.includes("upi")) recs.push("Only pay to UPI IDs you can independently verify");
  if (highRisk.length === 0) recs.push("Continue scanning before interacting with unknown content");
  recs.push("Report confirmed scams at cybercrime.gov.in");

  return { summary, recommendations: recs.slice(0, 3) };
}

async function enrichInsightsWithAI(userId: string, scans: any[], cacheKey: string) {
  try {
    const recentSignals = scans
      .filter((s) => s.analysis && s.analysis.riskScore >= 40)
      .map((s) => `${s.scanType} (risk: ${s.analysis.riskScore}): ${s.content.slice(0, 50)}`)
      .join("; ");

    const context = {
      scanType: "message" as const,
      content: recentSignals || "recent safe activity",
      riskScore: scans[0]?.analysis?.riskScore || 0,
      riskLevel: (scans[0]?.analysis?.riskLevel || "SAFE").toLowerCase(),
      signals: [],
    };

    const summary = await aiService.summarizeThreat(context);
    const aiInsights = {
      summary,
      recommendations: [
        "Review flagged content carefully before interacting",
        "Block senders of high-risk messages",
        "Report confirmed scams to cybercrime.gov.in",
      ],
    };

    // Update cache with AI-enriched version (5 min TTL)
    setCached(cacheKey, aiInsights, 300_000);
  } catch {
    // AI failed — rule-based version stays in cache, no harm done
  }
}
