import { mockHistory, mockReports, type HistoryItem, type ReportItem } from "@/components/history/mocks";
import { type NotificationItem } from "./mocks";

// Single source of truth: derive all dashboard data from history + reports

export function getLatestRiskScore(): number {
  if (mockHistory.length === 0) return 0;
  return mockHistory[0].riskScore;
}

export function getThreatLevel(): "protected" | "warning" | "high-risk" {
  const latest = mockHistory[0];
  if (!latest) return "protected";
  if (latest.riskLevel === "critical" || latest.riskLevel === "high") return "high-risk";
  if (latest.riskLevel === "medium") return "warning";
  return "protected";
}

export function getScansToday(): number {
  const today = new Date().toISOString().split("T")[0];
  return mockHistory.filter((h) => h.timestamp.startsWith(today)).length || mockHistory.length;
}

export function getThreatsBlocked(): number {
  return mockHistory.filter((h) => h.status === "blocked").length;
}

export function getLastScanTime(): string {
  if (mockHistory.length === 0) return "Never";
  const d = new Date(mockHistory[0].timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function getRecentScans(limit = 5): HistoryItem[] {
  return mockHistory.slice(0, limit);
}

export function getRecentReports(limit = 3): ReportItem[] {
  return mockReports.slice(0, limit);
}

export interface TimelineEvent {
  id: string;
  type: "scan" | "threat" | "report" | "action";
  label: string;
  detail: string;
  time: string;
}

export function getTimelineEvents(): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  mockHistory.slice(0, 4).forEach((h) => {
    const d = new Date(h.timestamp);
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    events.push({
      id: `scan-${h.id}`,
      type: "scan",
      label: `${h.scanType.charAt(0).toUpperCase() + h.scanType.slice(1)} Scan`,
      detail: h.contentPreview.slice(0, 40) + "...",
      time,
    });
    if (h.status === "blocked") {
      events.push({
        id: `threat-${h.id}`,
        type: "threat",
        label: "Threat Detected",
        detail: `Risk score: ${h.riskScore} — ${h.riskLevel}`,
        time,
      });
    }
  });

  mockReports.slice(0, 2).forEach((r) => {
    const d = new Date(r.createdAt);
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    events.push({
      id: `report-${r.id}`,
      type: "report",
      label: "Report Submitted",
      detail: r.description.slice(0, 40) + "...",
      time,
    });
  });

  return events.slice(0, 8);
}

export function generateNotifications(): NotificationItem[] {
  const notifications: NotificationItem[] = [];

  // From recent blocked threats
  const blocked = mockHistory.filter((h) => h.status === "blocked");
  blocked.slice(0, 2).forEach((h, i) => {
    notifications.push({
      id: `notif-threat-${h.id}`,
      type: "alert",
      title: `${h.riskLevel === "critical" ? "Critical" : "High-risk"} threat detected`,
      message: h.contentPreview.slice(0, 60),
      timestamp: getRelativeTime(h.timestamp),
      read: i > 0,
    });
  });

  // From reports
  const reviewed = mockReports.filter((r) => r.status === "under_review" || r.status === "resolved");
  reviewed.slice(0, 1).forEach((r) => {
    notifications.push({
      id: `notif-report-${r.id}`,
      type: "update" as const,
      title: `Report ${r.status === "resolved" ? "resolved" : "under review"}`,
      message: `${r.reportNumber} — ${r.description.slice(0, 40)}`,
      timestamp: getRelativeTime(r.updatedAt),
      read: r.status === "resolved",
    });
  });

  // Security tip based on scan types
  const scanTypes = mockHistory.map((h) => h.scanType);
  if (scanTypes.includes("url")) {
    notifications.push({
      id: "notif-tip-url",
      type: "security_tip",
      title: "Verify URLs before clicking",
      message: "Always check domain spelling. Scammers use look-alike URLs.",
      timestamp: "1 day ago",
      read: true,
    });
  } else if (scanTypes.includes("upi")) {
    notifications.push({
      id: "notif-tip-upi",
      type: "security_tip",
      title: "Never accept unknown collect requests",
      message: "Verify UPI IDs through official channels before transacting.",
      timestamp: "2 days ago",
      read: true,
    });
  } else {
    notifications.push({
      id: "notif-tip-general",
      type: "security_tip",
      title: "Stay vigilant against new threats",
      message: "Scan suspicious messages regularly for your protection.",
      timestamp: "3 days ago",
      read: true,
    });
  }

  return notifications;
}

function getRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  if (diff < 2880) return "Yesterday";
  return `${Math.floor(diff / 1440)} days ago`;
}

export function getSecurityTips(): string[] {
  const types = new Set(mockHistory.map((h) => h.scanType));
  const tips: string[] = [];

  if (types.has("url")) {
    tips.push("Always verify domain spelling before entering credentials.");
    tips.push("Look for HTTPS and valid certificates on banking websites.");
  }
  if (types.has("upi")) {
    tips.push("Never share UPI PIN — it is only for confirming YOUR payments.");
    tips.push("Verify UPI IDs through official bank apps, not links.");
  }
  if (types.has("message")) {
    tips.push("Banks never send SMS asking for OTP or passwords.");
    tips.push("Urgency in messages is a red flag for social engineering.");
  }
  if (types.has("voice")) {
    tips.push("No police officer will ask for money over the phone.");
    tips.push("AI-generated voices can mimic real people — stay cautious.");
  }

  if (tips.length < 3) {
    tips.push("Report suspicious activity to help protect the community.");
    tips.push("Keep your devices and apps updated to the latest versions.");
  }

  return tips.slice(0, 4);
}
