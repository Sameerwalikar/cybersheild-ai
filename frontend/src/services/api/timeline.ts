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

export interface TimelineEventItem {
  id: string;
  type: string;
  actorType: string;
  title: string;
  description: string | null;
  severity: string;
  timestamp: string;
  relatedAnalysis: string | null;
  relatedIncident: string | null;
  relatedEvidence: string | null;
  relatedReport: string | null;
}

export interface TimelineResponse {
  items: TimelineEventItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface TimelineStats {
  totalToday: number;
  totalWeek: number;
  byType: { type: string; count: number }[];
}

export const timelineApi = {
  list: (params?: { type?: string; severity?: string; days?: number; cursor?: string }) => {
    const qs = new URLSearchParams();
    if (params?.type && params.type !== "all") qs.set("type", params.type);
    if (params?.severity && params.severity !== "all") qs.set("severity", params.severity);
    if (params?.days) qs.set("days", String(params.days));
    if (params?.cursor) qs.set("cursor", params.cursor);
    return get<TimelineResponse>(`/timeline?${qs.toString()}`);
  },
  stats: () => get<TimelineStats>("/timeline/stats"),
};
