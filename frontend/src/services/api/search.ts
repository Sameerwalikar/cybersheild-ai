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

export interface InvestigationResult {
  id: string;
  type: "investigation";
  incidentId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedOfficer: string | null;
  relatedReportIds: string[];
  updatedAt: string;
}

export interface ReportResult {
  id: string;
  type: "report";
  reportNumber: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  citizenName: string;
  scammerContact: any;
  createdAt: string;
}

export interface ScammerResult {
  id: string;
  type: "scammer";
  phones: string[];
  emails: string[];
  upiIds: string[];
  domains: string[];
  threatLevel: string;
  occurrences: number;
  totalReports: number;
  lastSeen: string;
}

export interface EntityResult {
  id: string;
  type: "entity";
  entityType: string;
  value: string;
  occurrences: number;
  riskLevel: string;
  firstSeen: string;
  lastSeen: string;
}

export interface TimelineResult {
  id: string;
  type: "timeline";
  eventType: string;
  title: string;
  description: string | null;
  severity: string;
  timestamp: string;
  relatedReport: string | null;
  relatedIncident: string | null;
}

export interface EvidenceResult {
  id: string;
  type: "evidence";
  filename: string;
  mimeType: string;
  riskLevel: string;
  riskScore: number;
  visionSummary: string | null;
  uploadedBy: string;
  createdAt: string;
}

export interface SearchResults {
  investigations: InvestigationResult[];
  reports: ReportResult[];
  scammers: ScammerResult[];
  graphNodes: EntityResult[];
  timeline: TimelineResult[];
  evidence: EvidenceResult[];
}

export interface SearchFilters {
  threatLevel?: string;
  status?: string;
  category?: string;
  investigationStatus?: string;
}

export const searchApi = {
  search: (query: string, filters?: SearchFilters, limit = 10): Promise<SearchResults> => {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (filters?.threatLevel) params.set("threatLevel", filters.threatLevel);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.investigationStatus) params.set("investigationStatus", filters.investigationStatus);
    return get<SearchResults>(`/search?${params.toString()}`);
  },
};
