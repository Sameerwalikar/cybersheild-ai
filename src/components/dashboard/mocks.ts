export interface ThreatStatusData {
  score: number;
  level: "protected" | "warning" | "high-risk";
  lastScanTime: string;
  scansToday: number;
  threatsBlocked: number;
}

export interface NotificationItem {
  id: string;
  type: "security_tip" | "alert" | "update";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const mockThreatStatus: ThreatStatusData = {
  score: 92,
  level: "protected",
  lastScanTime: "2 minutes ago",
  scansToday: 7,
  threatsBlocked: 3,
};

export const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    type: "alert",
    title: "Phishing attempt blocked",
    message: "A suspicious link from an unknown sender was automatically blocked.",
    timestamp: "5 min ago",
    read: false,
  },
  {
    id: "n2",
    type: "security_tip",
    title: "Enable two-factor authentication",
    message: "Protect your account with an additional security layer.",
    timestamp: "1 hour ago",
    read: false,
  },
  {
    id: "n3",
    type: "update",
    title: "New scan type available",
    message: "Voice Analysis is now available in your Quick Actions.",
    timestamp: "3 hours ago",
    read: true,
  },
  {
    id: "n4",
    type: "alert",
    title: "Suspicious UPI ID reported",
    message: "A UPI ID you interacted with has been flagged by the community.",
    timestamp: "Yesterday",
    read: true,
  },
  {
    id: "n5",
    type: "security_tip",
    title: "Never share OTP with anyone",
    message: "Banks and services will never ask for your OTP over phone or SMS.",
    timestamp: "2 days ago",
    read: true,
  },
];

export interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
}

export const mockQuickActions: QuickActionItem[] = [
  { id: "scan-message", label: "Scan Message", description: "Analyze SMS or WhatsApp", href: "/scan?type=message", icon: "message" },
  { id: "scan-website", label: "Scan Website", description: "Check URL safety", href: "/scan?type=url", icon: "globe" },
  { id: "scan-qr", label: "Scan QR", description: "Decode & verify QR", href: "/scan?type=qr", icon: "qr" },
  { id: "scan-upi", label: "Scan UPI", description: "Verify UPI ID", href: "/scan?type=upi", icon: "upi" },
  { id: "voice-analysis", label: "Voice Analysis", description: "Detect vishing", href: "/scan?type=voice", icon: "mic" },
  { id: "report-scam", label: "Report Scam", description: "Submit a report", href: "/reports?action=new", icon: "alert" },
];
