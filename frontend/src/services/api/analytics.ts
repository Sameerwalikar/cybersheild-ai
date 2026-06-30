const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

async function get<T>(endpoint: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.data as T;
}

export interface AnalyticsDashboard {
  totalScans: number;
  highRiskThreats: number;
  criticalThreats: number;
  reportsSubmitted: number;
  activeInvestigations: number;
  evidenceUploaded: number;
  repeatScammers: number;
  newVictims: number;
}

export interface TrendsData {
  dailyScans: { date: string; count: number }[];
  categoryDistribution: { type: string; count: number }[];
  riskDistribution: { level: string; count: number }[];
  weeklyReports: { week: string; count: number }[];
  dailyHighRisk: { date: string; count: number }[];
}

export interface IndicatorItem {
  rank: number;
  id: string;
  value: string;
  occurrences: number;
  riskLevel: string;
  firstSeen: string;
  lastSeen: string;
}

export interface TopIndicators {
  phones: IndicatorItem[];
  emails: IndicatorItem[];
  upis: IndicatorItem[];
  domains: IndicatorItem[];
  urls: IndicatorItem[];
}

export interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  severity: string;
  actorType: string;
  timestamp: string;
  relatedReport: string | null;
  relatedIncident: string | null;
  relatedEvidence: string | null;
  relatedAnalysis: string | null;
}

export interface ScammerItem {
  id: string;
  primaryContact: string;
  phones: string[];
  emails: string[];
  upiIds: string[];
  domains: string[];
  threatLevel: string;
  occurrences: number;
  totalReports: number;
  aliases: string[];
  firstSeen: string;
  lastSeen: string;
}

export interface ScammerProfile {
  id: string;
  phones: string[];
  emails: string[];
  upiIds: string[];
  domains: string[];
  urls: string[];
  walletIds: string[];
  aliases: string[];
  threatLevel: string;
  occurrences: number;
  totalReports: number;
  totalVictims: number;
  graphNodeIds: string[];
  firstSeen: string;
  lastSeen: string;
  reports: { id: string; reportNumber: string; type: string; status: string; description: string; createdAt: string }[];
}

export interface ScammerTimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  severity: string;
  timestamp: string;
}

export interface SimilarScammer {
  id: string;
  primaryContact: string;
  threatLevel: string;
  occurrences: number;
  similarity: number;
  sharedEntities: number;
}

export const analyticsApi = {
  getDashboard: () => get<AnalyticsDashboard>("/analytics/dashboard"),
  getTrends: () => get<TrendsData>("/analytics/trends"),
  getTopIndicators: () => get<TopIndicators>("/analytics/top-indicators"),
  getActivityFeed: (limit = 30) => get<ActivityEvent[]>(`/analytics/activity-feed?limit=${limit}`),
  getRepeatScammers: (page = 1) => get<{ items: ScammerItem[]; pagination: any }>(`/analytics/repeat-scammers?page=${page}`),
  getScammer: (id: string) => get<ScammerProfile>(`/analytics/scammers/${id}`),
  getScammerTimeline: (id: string) => get<ScammerTimelineEvent[]>(`/analytics/scammers/${id}/timeline`),
  getScammerSimilar: (id: string) => get<SimilarScammer[]>(`/analytics/scammers/${id}/similar`),
};
