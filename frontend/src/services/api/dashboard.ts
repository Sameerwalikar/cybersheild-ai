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

export interface DashboardOverview {
  total: number;
  safe: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
  avgRiskScore: number;
  securityScore: number;
}

export interface DashboardHistoryItem {
  id: string;
  scanType: string;
  content: string;
  riskScore: number;
  riskLevel: string;
  timestamp: string;
}

export interface TimelinePoint {
  date: string;
  scans: number;
  threats: number;
  avgRisk: number;
}

export interface DashboardInsights {
  summary: string;
  recommendations: string[];
}

export interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  timestamp: string;
}

export interface NotificationsResponse {
  items: DashboardNotification[];
  unreadCount: number;
}

export const dashboardApi = {
  // New: single request for all dashboard data
  getAll: () => get<{ overview: DashboardOverview; history: DashboardHistoryItem[]; timeline: TimelinePoint[]; insights: DashboardInsights; notifications: NotificationsResponse }>("/dashboard/all"),
  // Individual endpoints kept for backwards compatibility
  getOverview: () => get<DashboardOverview>("/dashboard/overview"),
  getHistory: () => get<DashboardHistoryItem[]>("/dashboard/history"),
  getTimeline: (days = 7) => get<TimelinePoint[]>(`/dashboard/timeline?days=${days}`),
  getInsights: () => get<DashboardInsights>("/dashboard/insights"),
  getNotifications: () => get<NotificationsResponse>("/dashboard/notifications"),
};
