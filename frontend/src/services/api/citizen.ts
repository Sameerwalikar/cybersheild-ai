import { apiClient } from "./client";

export interface ScanRequest {
  type: "sms" | "url" | "phone" | "upi";
  content: string;
}

export interface ScanResult {
  id: string;
  riskScore: number;
  threats: string[];
  recommendation: string;
  timestamp: string;
}

export interface Report {
  id: string;
  type: string;
  status: "pending" | "investigating" | "resolved";
  createdAt: string;
}

export const citizenApi = {
  scan: (data: ScanRequest) => apiClient.post<ScanResult>("/citizen/scan", data),
  getReports: () => apiClient.get<Report[]>("/citizen/reports"),
  createReport: (data: { type: string; content: string }) => apiClient.post<Report>("/citizen/reports", data),
  getThreatHistory: () => apiClient.get<ScanResult[]>("/citizen/threats"),
};
