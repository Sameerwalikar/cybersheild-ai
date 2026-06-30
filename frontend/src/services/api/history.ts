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

export interface HistoryItemFull {
  id: string;
  scanType: string;
  content: string;
  riskScore: number;
  riskLevel: string;
  summary: string;
  recommendation: string;
  signals: { label: string; severity: string; confidence: number; description: string }[];
  timestamp: string;
  status: string;
}

export interface HistoryDetail extends HistoryItemFull {
  confidence: number;
  processingTime: number;
  riskBreakdown: { overall: number; content: number; source: number; pattern: number; community: number } | null;
}

export interface HistoryResponse {
  items: HistoryItemFull[];
  pagination: { total: number; hasMore: boolean; nextCursor: string | null };
}

export interface HistoryTrends {
  weeklyScans: number;
  highestRiskScore: number;
  highestRiskType: string | null;
  mostCommonThreat: string;
}

export interface HistoryQuery {
  search?: string;
  riskLevel?: string;
  scanType?: string;
  dateRange?: string;
  sortBy?: string;
  cursor?: string;
  limit?: number;
}

export const historyApi = {
  getHistory: (params?: HistoryQuery) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.riskLevel) qs.set("riskLevel", params.riskLevel);
    if (params?.scanType) qs.set("scanType", params.scanType);
    if (params?.dateRange) qs.set("dateRange", params.dateRange);
    if (params?.sortBy) qs.set("sortBy", params.sortBy);
    if (params?.cursor) qs.set("cursor", params.cursor);
    if (params?.limit) qs.set("limit", String(params.limit));
    return get<HistoryResponse>(`/history?${qs.toString()}`);
  },
  getDetail: (id: string) => get<HistoryDetail>(`/history/${id}`),
  getTrends: () => get<HistoryTrends>("/history/trends"),
  exportCsv: () => `${BASE}/history/export?format=csv`,
};
