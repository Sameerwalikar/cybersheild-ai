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

export interface IncidentSummary {
  id: string;
  incidentId: string;
  title: string;
  priority: string;
  severity: string;
  status: string;
  assignedOfficer: string | null;
  createdBy: string;
  evidenceCount: number;
  relatedReportIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LinkedReport {
  id: string;
  reportNumber: string;
  type: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
}

export interface LinkedScammer {
  id: string;
  phones: string[];
  emails: string[];
  upiIds: string[];
  threatLevel: string;
  occurrences: number;
  totalReports: number;
}

export interface LinkedNode {
  id: string;
  type: string;
  value: string;
  occurrences: number;
  riskLevel: string;
}

export interface IncidentDetail {
  id: string;
  incidentId: string;
  title: string;
  description: string | null;
  priority: string;
  severity: string;
  status: string;
  assignedOfficer: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string };
  resolutionSummary: string | null;
  evidenceCount: number;
  relatedReportIds: string[];
  relatedScanIds: string[];
  relatedNodeIds: string[];
  linkedReports: LinkedReport[];
  linkedScammers: LinkedScammer[];
  linkedNodes: LinkedNode[];
  timeline: { id: string; type: string; description: string; actorId: string | null; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface IncidentStats {
  total: number;
  new: number;
  investigating: number;
  resolved: number;
  critical: number;
}

export const incidentsApi = {
  list: (params?: { status?: string; priority?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    if (params?.priority && params.priority !== "all") qs.set("priority", params.priority);
    if (params?.page) qs.set("page", String(params.page));
    return request<{ items: IncidentSummary[]; pagination: any }>("GET", `/incidents?${qs.toString()}`);
  },
  getById: (id: string) => request<IncidentDetail>("GET", `/incidents/${id}`),
  create: (data: { title: string; description?: string; priority?: string; severity?: string; relatedReportIds?: string[] }) =>
    request<any>("POST", "/incidents", data),
  update: (id: string, data: any) => request<any>("PATCH", `/incidents/${id}`, data),
  updateStatus: (id: string, status: string) => request<any>("PATCH", `/incidents/${id}/status`, { status }),
  assign: (id: string, officerId: string) => request<any>("POST", `/incidents/${id}/assign`, { officerId }),
  addNote: (id: string, content: string) => request<any>("POST", `/incidents/${id}/note`, { content }),
  linkReport: (id: string, reportId: string) => request<any>("POST", `/incidents/${id}/link-report`, { reportId }),
  unlinkReport: (id: string, reportId: string) => request<any>("POST", `/incidents/${id}/unlink-report`, { reportId }),
  linkEvidence: (id: string, nodeIds: string[]) => request<any>("POST", `/incidents/${id}/link-evidence`, { nodeIds }),
  merge: (id: string, sourceId: string) => request<any>("POST", `/incidents/${id}/merge`, { sourceId }),
  close: (id: string, resolutionSummary: string) => request<any>("POST", `/incidents/${id}/close`, { resolutionSummary }),
  getTimeline: (id: string) => request<any[]>("GET", `/incidents/${id}/timeline`),
  getStats: () => request<IncidentStats>("GET", "/incidents/stats"),
};
