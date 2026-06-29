"use client";

import Link from "next/link";
import { type ReactNode } from "react";

interface ScannerLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  helpTips?: string[];
}

const defaultTips = [
  "Never share OTPs with anyone.",
  "Verify suspicious domains carefully.",
  "Avoid clicking shortened URLs from unknown senders.",
  "Legitimate banks never ask for credentials via SMS.",
];

export function ScannerLayout({ title, description, children, helpTips = defaultTips }: ScannerLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      {/* Main content */}
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link href="/scan" className="inline-flex items-center gap-1.5 text-xs text-[#B6B8C4] hover:text-[#EC9AA3] transition-colors mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Scanner
          </Link>
          <h1 className="text-xl font-bold text-[#F8F8FA]">{title}</h1>
          <p className="mt-1 text-sm text-[#B6B8C4]">{description}</p>
        </div>

        {/* Scanner content */}
        {children}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4 hidden lg:block">
        {/* Help panel */}
        <div className="rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] p-4">
          <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Safety Tips</h3>
          <ul className="space-y-2.5">
            {helpTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#EC9AA3]/50 mt-1.5 flex-shrink-0" />
                <span className="text-[11px] text-[#B6B8C4] leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent scans */}
        <div className="rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] p-4">
          <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Recent Scans</h3>
          <div className="space-y-2">
            {recentScans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between py-2 border-b border-[rgba(236,154,163,0.04)] last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${scan.status === "safe" ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className="text-[11px] text-[#F8F8FA]">{scan.type}</span>
                </div>
                <span className="text-[9px] text-[#B6B8C4]/60">{scan.time}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

const recentScans = [
  { id: "1", type: "SMS Message", time: "2 min ago", status: "safe" },
  { id: "2", type: "Website URL", time: "15 min ago", status: "threat" },
  { id: "3", type: "UPI ID", time: "1 hour ago", status: "safe" },
  { id: "4", type: "QR Code", time: "3 hours ago", status: "safe" },
];
