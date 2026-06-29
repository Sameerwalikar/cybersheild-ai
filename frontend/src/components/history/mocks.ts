export interface HistoryItem {
  id: string;
  scanType: "message" | "url" | "qr" | "upi" | "voice";
  riskScore: number;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  contentPreview: string;
  timestamp: string;
  status: "completed" | "blocked";
}

export interface ReportItem {
  id: string;
  reportNumber: string;
  category: "phishing" | "financial_fraud" | "identity_theft" | "vishing" | "upi_fraud" | "other";
  description: string;
  status: "submitted" | "under_review" | "resolved" | "rejected";
  attachments: number;
  createdAt: string;
  updatedAt: string;
}

export const mockHistory: HistoryItem[] = [
  { id: "ANL-2026-00847", scanType: "message", riskScore: 94, riskLevel: "critical", contentPreview: "Your SBI account has been suspended. Verify immediately at sbi-secure-login.xyz", timestamp: "2026-06-30T14:23:00Z", status: "blocked" },
  { id: "ANL-2026-00842", scanType: "url", riskScore: 87, riskLevel: "high", contentPreview: "https://paypal-verify-account.com/login", timestamp: "2026-06-30T11:45:00Z", status: "blocked" },
  { id: "ANL-2026-00838", scanType: "upi", riskScore: 12, riskLevel: "safe", contentPreview: "shop@paytm", timestamp: "2026-06-29T18:30:00Z", status: "completed" },
  { id: "ANL-2026-00831", scanType: "message", riskScore: 67, riskLevel: "medium", contentPreview: "Congratulations! You've won ₹50,000. Click here to claim.", timestamp: "2026-06-29T09:12:00Z", status: "blocked" },
  { id: "ANL-2026-00825", scanType: "qr", riskScore: 8, riskLevel: "safe", contentPreview: "QR Code → https://razorpay.com/pay/abcd123", timestamp: "2026-06-28T16:45:00Z", status: "completed" },
  { id: "ANL-2026-00819", scanType: "voice", riskScore: 78, riskLevel: "high", contentPreview: "Voice recording — 34s — Social engineering detected", timestamp: "2026-06-28T10:20:00Z", status: "blocked" },
  { id: "ANL-2026-00811", scanType: "url", riskScore: 5, riskLevel: "safe", contentPreview: "https://www.amazon.in/product/B08N5WRWNW", timestamp: "2026-06-27T14:55:00Z", status: "completed" },
  { id: "ANL-2026-00804", scanType: "message", riskScore: 91, riskLevel: "critical", contentPreview: "URGENT: Your Aadhaar has been compromised. Call +91 98XX immediately.", timestamp: "2026-06-27T08:30:00Z", status: "blocked" },
  { id: "ANL-2026-00798", scanType: "upi", riskScore: 45, riskLevel: "medium", contentPreview: "unknown123@ybl", timestamp: "2026-06-26T19:15:00Z", status: "completed" },
  { id: "ANL-2026-00790", scanType: "qr", riskScore: 72, riskLevel: "high", contentPreview: "QR Code → suspicious payment redirect", timestamp: "2026-06-26T11:40:00Z", status: "blocked" },
];

export const mockReports: ReportItem[] = [
  { id: "rpt-1", reportNumber: "RPT-2026-001247", category: "phishing", description: "Received fake SBI SMS with suspicious link asking for credentials.", status: "under_review", attachments: 2, createdAt: "2026-06-30T14:30:00Z", updatedAt: "2026-06-30T15:00:00Z" },
  { id: "rpt-2", reportNumber: "RPT-2026-001198", category: "upi_fraud", description: "Unknown UPI collect request from fraudster@ybl claiming cashback.", status: "resolved", attachments: 1, createdAt: "2026-06-28T10:00:00Z", updatedAt: "2026-06-29T12:00:00Z" },
  { id: "rpt-3", reportNumber: "RPT-2026-001154", category: "vishing", description: "Call from fake Cyber Police officer demanding immediate payment.", status: "submitted", attachments: 0, createdAt: "2026-06-26T09:45:00Z", updatedAt: "2026-06-26T09:45:00Z" },
  { id: "rpt-4", reportNumber: "RPT-2026-001089", category: "financial_fraud", description: "Fake investment scheme promising 40% monthly returns on WhatsApp group.", status: "resolved", attachments: 3, createdAt: "2026-06-22T16:20:00Z", updatedAt: "2026-06-25T11:30:00Z" },
  { id: "rpt-5", reportNumber: "RPT-2026-001042", category: "identity_theft", description: "Someone opened a bank account using my PAN and Aadhaar details.", status: "under_review", attachments: 4, createdAt: "2026-06-19T08:15:00Z", updatedAt: "2026-06-28T09:00:00Z" },
];

export const scanTypeLabels: Record<string, string> = {
  message: "Message",
  url: "Website",
  qr: "QR Code",
  upi: "UPI",
  voice: "Voice",
};

export const categoryLabels: Record<string, string> = {
  phishing: "Phishing",
  financial_fraud: "Financial Fraud",
  identity_theft: "Identity Theft",
  vishing: "Vishing",
  upi_fraud: "UPI Fraud",
  other: "Other",
};

export const statusStyles: Record<string, { color: string; bg: string }> = {
  submitted: { color: "text-[#B6B8C4]", bg: "bg-[#B6B8C4]" },
  under_review: { color: "text-amber-400", bg: "bg-amber-400" },
  resolved: { color: "text-emerald-400", bg: "bg-emerald-400" },
  rejected: { color: "text-red-400", bg: "bg-red-400" },
};

export const riskColors: Record<string, string> = {
  safe: "text-emerald-400",
  low: "text-emerald-300",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

export const riskBg: Record<string, string> = {
  safe: "bg-emerald-400",
  low: "bg-emerald-300",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-red-400",
};
