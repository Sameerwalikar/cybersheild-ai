export type Role = "citizen" | "police" | "organization";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Threat {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  timestamp: string;
  status: "detected" | "analyzing" | "blocked" | "resolved";
}

export interface Investigation {
  id: string;
  caseId: string;
  threatType: string;
  status: "active" | "monitoring" | "resolved" | "critical";
  confidence: number;
  city: string;
  connectedEntities: number;
  createdAt: string;
  updatedAt: string;
}

export interface FraudNetwork {
  id: string;
  nodes: number;
  edges: number;
  cities: string[];
  confidence: number;
  status: "active" | "dismantled";
}

export interface ScanResult {
  id: string;
  type: "sms" | "url" | "phone" | "upi";
  content: string;
  riskScore: number;
  threats: string[];
  recommendation: string;
  timestamp: string;
}
