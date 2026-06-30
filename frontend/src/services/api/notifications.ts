const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

async function request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: "include",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.data as T;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  actionUrl: string | null;
  timestamp: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unreadCount: number;
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface ActivityItem {
  id: string;
  type: string;
  label: string;
  detail: string;
  severity: string;
  timestamp: string;
}

export const notificationsApi = {
  list: (page = 1, limit = 20) => request<NotificationListResponse>("GET", `/notifications?page=${page}&limit=${limit}`),
  markRead: (id: string) => request<any>("PATCH", `/notifications/${id}/read`),
  markAllRead: () => request<{ count: number }>("PATCH", "/notifications/read-all"),
  remove: (id: string) => request<any>("DELETE", `/notifications/${id}`),
  activity: (page = 1, type?: string) => request<{ items: ActivityItem[]; pagination: any }>("GET", `/notifications/activity?page=${page}${type ? `&type=${type}` : ""}`),
};
