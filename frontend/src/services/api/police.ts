export interface PoliceDashboardData {
  stats: {
    totalInvestigations: number;
    activeInvestigations: number;
    totalNetworks: number;
    totalEvidence: number;
    threatsToday: number;
    totalReports: number;
    pendingReports: number;
  };
  cityBreakdown: { city: string | null; count: number }[];
  recentInvestigations: { id: string; caseId: string; title: string; status: string; confidence: number; city: string | null; networkName: string | null; updatedAt: string }[];
  recentAnalyses: { id: string; riskScore: number; riskLevel: string; summary: string; scanType: string; createdAt: string }[];
  recentReports: { id: string; reportNumber: string; type: string; status: string; priority: string; citizenName: string; description: string; aiSummary: string | null; createdAt: string }[];
  criticalNotifications: { id: string; title: string; message: string; timestamp: string }[];
  recentIncidents: { id: string; incidentId: string; title: string; status: string; priority: string; updatedAt: string }[];
  topThreatCategories: { type: string; count: number }[];
  recentNetworks: { id: string; name: string; cities: string[]; nodeCount: number; status: string }[];
  reportStatsBreakdown: Record<string, number>;
  repeatScammers: { id: string; primaryContact: string; type: string; occurrences: number; totalReports: number; threatLevel: string }[];
}

export interface InvestigationItem {
  id: string;
  caseId: string;
  title: string;
  description: string | null;
  status: string;
  confidence: number;
  city: string | null;
  evidenceCount: number;
  networkName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FraudNetworkItem {
  id: string;
  name: string;
  cities: string[];
  confidence: number;
  nodeCount: number;
  edgeCount: number;
  status: string;
  investigations: number;
  evidenceCount: number;
}

export interface PoliceReportItem {
  id: string;
  reportNumber: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  citizenName: string;
  citizenEmail: string;
  aiSummary: string | null;
  scammerContact: any;
  financialLoss: any;
  evidence: string[];
  attachments: number;
  createdAt: string;
  updatedAt: string;
}

export interface PoliceReportDetail {
  id: string;
  reportNumber: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string | null;
  citizenLocation: string | null;
  aiSummary: string | null;
  acknowledgement: string | null;
  internalNotes: string[];
  scammerContact: any;
  financialLoss: any;
  evidence: string[];
  scammerProfile: {
    id: string;
    phones: string[];
    emails: string[];
    upiIds: string[];
    domains: string[];
    occurrences: number;
    totalReports: number;
    threatLevel: string;
    firstSeen: string;
    lastSeen: string;
  } | null;
  extractedEntities: { type: string; value: string }[];
  investigation: { id: string; caseId: string; status: string; evidence: { id: string; type: string; value: string }[] } | null;
  createdAt: string;
  updatedAt: string;
}

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

async function patch<T>(endpoint: string, body: any): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.data as T;
}

async function post<T>(endpoint: string, body: any): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.data as T;
}

export const policeApi = {
  getDashboard: () => get<PoliceDashboardData>("/police/dashboard"),
  getInvestigations: (status?: string, page = 1) => get<{ items: InvestigationItem[]; pagination: any }>(`/police/investigations?page=${page}${status ? `&status=${status}` : ""}`),
  getInvestigation: (id: string) => get<any>(`/police/investigations/${id}`),
  getNetworks: (page = 1) => get<{ items: FraudNetworkItem[]; pagination: any }>(`/police/networks?page=${page}`),
  getAnalytics: () => get<any>("/police/analytics"),

  // Reports (case management)
  getReports: (params?: { status?: string; priority?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.priority) qs.set("priority", params.priority);
    if (params?.page) qs.set("page", String(params.page));
    const q = qs.toString();
    return get<{ items: PoliceReportItem[]; pagination: any }>(`/reports/police/all${q ? `?${q}` : ""}`);
  },
  getReport: (id: string) => get<PoliceReportDetail>(`/reports/police/${id}`),
  updateReportStatus: (id: string, status: string) => patch<any>(`/reports/police/${id}/status`, { status }),
  assignReport: (id: string, officerId: string) => patch<any>(`/reports/police/${id}/assign`, { officerId }),
  acknowledgeReport: (id: string, message: string) => post<any>(`/reports/police/${id}/acknowledge`, { message }),
  addReportNote: (id: string, note: string) => post<any>(`/reports/police/${id}/note`, { note }),
  getReportStats: () => get<any>("/reports/police/stats"),
  getScammerProfiles: (page = 1) => get<any>(`/reports/police/scammers?page=${page}`),
  getTopEntities: () => get<any>("/reports/police/top-entities"),

  // IP Tracing endpoints
  getIpRiskProfile: (ip: string, bypassCache = false) => get<any>(`/police/ip-trace/${ip}${bypassCache ? "?bypassCache=true" : ""}`),
  addIpToList: (ip: string, listType: string, note?: string) => post<any>(`/police/ip-trace/${ip}/list`, { list_type: listType, note }),
  getIpQuotas: () => get<any>("/police/ip-trace/quotas"),
};
