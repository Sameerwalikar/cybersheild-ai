export interface ThreatContext {
  scanType: "message" | "url" | "qr" | "upi" | "voice";
  content: string;
  riskScore: number;
  riskLevel: string;
  signals: { label: string; severity: string; confidence: number; description: string }[];
}

export interface ImageContext {
  imageBase64: string;
  mimeType: string;
  description?: string;
}

export interface AIAnalysisResponse {
  riskScore: number;
  confidence: number;
  category: string;
  explanation: string;
  detectedSignals: string[];
  recommendations: string[];
  aiSummary: string;
}

export interface AIExplanationResponse {
  explanation: string;
  threatSummary: string;
  recommendedActions: string[];
  technicalReasoning: string;
  citizenAdvice: string;
  policeNotes: string;
}

export interface AIProvider {
  analyzeText(prompt: string, systemPrompt?: string): Promise<string>;
  analyzeImage(imageBase64: string, mimeType: string, prompt: string): Promise<string>;
  generateCitizenAdvice(context: ThreatContext): Promise<string>;
  generatePoliceSummary(context: ThreatContext): Promise<string>;
  extractThreatSignals(content: string): Promise<string[]>;
  summarizeThreat(context: ThreatContext): Promise<string>;
}
