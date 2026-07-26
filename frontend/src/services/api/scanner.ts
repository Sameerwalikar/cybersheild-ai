const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login?role=citizen";
    }
    throw new Error("Session expired. Please log in again.");
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.data as T;
}

async function get<T>(endpoint: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: "include",
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login?role=citizen";
    }
    throw new Error("Session expired. Please log in again.");
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.data as T;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface ScanSignal {
  label:       string;
  severity:    string;
  confidence:  number;
  description: string;
}

export interface ScanIntel {
  /** Lexical analysis — always present for URL scans */
  lexical: {
    score:                       number;
    detectedBrands:              string[];
    detectedKeywords:            string[];
    suspiciousTld:               boolean;
    entropy:                     "LOW" | "MEDIUM" | "HIGH";
    hyphenCount:                 number;
    credentialHarvestingPattern: boolean;
    subdomainDeception:          boolean;
    punycodeDetected:            boolean;
    ipAddressUrl:                boolean;
    reasons:                     string[];
  } | null;
  google: {
    detected:    boolean;
    threatTypes: string[];
    available:   boolean;
  } | null;
  virusTotal: {
    maliciousCount:  number;
    suspiciousCount: number;
    communityScore:  number;
    categories:      string[];
    available:       boolean;
  } | null;
  rdap: {
    domain:           string;
    registrar:        string | null;
    ageInDays:        number | null;
    registrationDate: string | null;
    isNewDomain:      boolean;
    isVeryNewDomain:  boolean;
    available:        boolean;
  } | null;
  engineReasons: string[];
}

export interface ScanAI {
  explanation:     string;
  category:        string;
  citizenAdvice:   string;
  policeSummary?:  string;
  recommendations: string[];
  aiSummary:       string;
}

export interface ScanResult {
  id:              string;
  scanId:          string;
  scanType:        string;
  riskScore:       number;
  riskLevel:       string;
  confidence:      number;
  summary:         string;
  recommendation:  string;
  signals:         ScanSignal[];
  processingTime:  number;
  timestamp:       string;
  /** AI enrichment — present when Gemini/NVIDIA responded successfully */
  ai?:    ScanAI | null;
  /** Threat intelligence — present for URL scans only */
  intel?: ScanIntel | null;
  verdict?: string;
  headline?: string;
  metadata?: any;
  decodedContent?: string;
  contentType?: string;
}

export interface HistoryItem {
  id:        string;
  scanType:  string;
  content:   string;
  riskScore: number;
  riskLevel: string;
  timestamp: string;
  status:    string;
}

// ─── API calls (unchanged shape — backward compatible) ───────────────────────

export const scannerApi = {
  scanMessage: (content: string, metadata?: { sender?: string; source?: string }) =>
    post<ScanResult>("/analyze/message", { content, metadata }),

  scanWebsite: (url: string, options?: { screenshot?: boolean; followRedirects?: boolean }) =>
    post<ScanResult>("/analyze/url", { url, options }),

  scanQr: (content: string, originalType: "url" | "upi" | "text" = "text") =>
    post<ScanResult>("/analyze/qr", { content, originalType }),

  scanUpi: (upiId: string) =>
    post<ScanResult>("/analyze/upi", { upiId }),

  scanVoice: (transcript: string, duration?: number) =>
    post<ScanResult>("/analyze/voice", { transcript, duration }),

  getHistory: () =>
    get<HistoryItem[]>("/analyze/history"),

  async uploadQrImage(file: File, signal?: AbortSignal): Promise<ScanResult> {
    const token = getToken();
    const formData = new FormData();
    formData.append("qrImage", file);

    const res = await fetch(`${BASE}/analyze/qr/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: formData,
      signal,
    });

    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login?role=citizen";
      }
      throw new Error("Session expired. Please log in again.");
    }

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.error || "Upload failed");
    return json.data as ScanResult;
  },

  classifyQrContent(decodedContent: string) {
    return post<{ contentType: string; confidence: "high" | "medium" | "low"; parsedFields: any }>(
      "/analyze/qr/classify",
      { decodedContent }
    );
  },

  analyzeQrParsed(decodedContent: string) {
    return post<any>(
      "/analyze/qr/analyze",
      { decodedContent }
    );
  },

  checkBreach: (email: string) =>
    post<any>("/breach-check", { email }),
};
