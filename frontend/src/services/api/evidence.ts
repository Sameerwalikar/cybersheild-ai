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

export interface EvidenceItem {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  riskScore: number;
  riskLevel: string;
  visionSummary: string;
  detectedEntities: string[];
  confidence: number;
  createdAt: string;
  cached?: boolean;
}

export const evidenceApi = {
  upload: (filename: string, mimeType: string, file: string) =>
    request<EvidenceItem>("POST", "/evidence/upload", { filename, mimeType, file }),
  list: (page = 1) => request<{ items: EvidenceItem[]; pagination: any }>("GET", `/evidence?page=${page}`),
  getById: (id: string) => request<EvidenceItem>("GET", `/evidence/${id}`),
  remove: (id: string) => request<any>("DELETE", `/evidence/${id}`),
};
