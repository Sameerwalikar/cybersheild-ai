const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json.data as T;
}

export interface ReportItem {
  id: string;
  reportNumber: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  scammerContact: any;
  financialLoss: any;
  evidence: string[];
  attachments: number;
  aiSummary: string | null;
  acknowledgement: string | null;
  assignedTo: string | null;
  occurredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportListResponse {
  items: ReportItem[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface CreateReportInput {
  type: string;
  description: string;
  scammerContact?: { phone?: string; email?: string; upiId?: string; website?: string };
  financialLoss?: { amount?: number; currency?: string; method?: string };
  evidence?: string[];
  occurredAt?: string;
}

export const reportsApi = {
  create: (data: CreateReportInput) =>
    request<ReportItem>("/reports", { method: "POST", body: JSON.stringify(data) }),

  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return request<ReportListResponse>(`/reports${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) => request<ReportItem>(`/reports/${id}`),
};
