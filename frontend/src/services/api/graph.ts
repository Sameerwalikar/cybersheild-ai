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

export interface GraphNodeData {
  id: string;
  type: string;
  value: string;
  occurrences: number;
  riskLevel: string;
  firstSeen?: string;
  lastSeen?: string;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface GraphNetwork {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  highRiskNodes: number;
}

export const graphApi = {
  search: (query: string) => get<GraphNodeData[]>(`/police/graph/search?q=${encodeURIComponent(query)}`),
  getNetwork: (nodeId: string) => get<GraphNetwork>(`/police/graph/${nodeId}`),
  getStats: () => get<GraphStats>("/police/graph/stats"),
  getTopEntities: (limit = 20) => get<GraphNodeData[]>(`/police/graph/top?limit=${limit}`),
};
