import { apiClient } from "./client";

export interface Investigation {
  id: string;
  caseId: string;
  threatType: string;
  status: "active" | "monitoring" | "resolved" | "critical";
  confidence: number;
  connectedEntities: number;
  city: string;
  createdAt: string;
}

export interface Evidence {
  id: string;
  investigationId: string;
  type: "phone" | "upi" | "domain" | "device" | "complaint";
  value: string;
  addedAt: string;
}

export interface FraudNetwork {
  id: string;
  nodes: number;
  edges: number;
  cities: string[];
  confidence: number;
}

export const policeApi = {
  getInvestigations: () => apiClient.get<Investigation[]>("/police/investigations"),
  getInvestigation: (id: string) => apiClient.get<Investigation>(`/police/investigations/${id}`),
  getEvidence: (investigationId: string) => apiClient.get<Evidence[]>(`/police/evidence/${investigationId}`),
  getFraudNetworks: () => apiClient.get<FraudNetwork[]>("/police/networks"),
  getAnalytics: () => apiClient.get<{ threats: number; investigations: number; citizens: number }>("/police/analytics"),
};
