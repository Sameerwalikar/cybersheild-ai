"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { reportsApi, type ReportItem } from "@/services/api/reports";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const statusFilters = ["all", "submitted", "under_review", "investigating", "action_taken", "resolved", "rejected"];

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  submitted: { bg: "bg-blue-400", color: "text-blue-400", label: "Submitted" },
  under_review: { bg: "bg-amber-400", color: "text-amber-400", label: "Under Review" },
  investigating: { bg: "bg-[#EC9AA3]", color: "text-[#EC9AA3]", label: "Investigating" },
  action_taken: { bg: "bg-emerald-400", color: "text-emerald-400", label: "Action Taken" },
  resolved: { bg: "bg-emerald-300", color: "text-emerald-300", label: "Resolved" },
  rejected: { bg: "bg-red-400", color: "text-red-400/60", label: "Rejected" },
  archived: { bg: "bg-[#B6B8C4]", color: "text-[#B6B8C4]/50", label: "Archived" },
};

const categoryLabels: Record<string, string> = {
  Phishing: "Phishing",
  "Financial Fraud": "Financial Fraud",
  "Identity Theft": "Identity Theft",
  "Vishing (Voice Scam)": "Vishing",
  "UPI Fraud": "UPI Fraud",
  Other: "Other",
};

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ total: number; page: number; pages: number } | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .list({ status: statusFilter !== "all" ? statusFilter.toUpperCase() : undefined })
      .then((data) => {
        setReports(data.items);
        setPagination(data.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <div>
          <h1 className="text-xl font-bold text-[#F8F8FA]">Reports</h1>
          <p className="mt-1 text-sm text-[#B6B8C4]">Track your submitted scam and fraud reports.</p>
        </div>
        <Link
          href="/scan/report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] shadow-[0_2px_8px_rgba(236,154,163,0.15)] hover:shadow-[0_4px_16px_rgba(236,154,163,0.2)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Report
        </Link>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize whitespace-nowrap transition-all duration-150 ${
              statusFilter === s
                ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]"
                : "text-[#B6B8C4] border border-transparent hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.03)]"
            }`}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {/* Loading */}
      {loading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-20 rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse" />))}</div>}

      {/* Results */}
      {!loading && !error && reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#12121A] border border-[rgba(236,154,163,0.08)] flex items-center justify-center mb-4 text-[#EC9AA3]/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          </div>
          <h3 className="text-sm font-semibold text-[#F8F8FA]">No reports yet</h3>
          <p className="mt-1 text-xs text-[#B6B8C4]">Report scams to help protect the community.</p>
          <Link href="/scan/report" className="mt-4 px-5 py-2 rounded-lg text-xs font-semibold text-[#050508] bg-[#EC9AA3] hover:shadow-[0_4px_12px_rgba(236,154,163,0.2)] transition-shadow">
            Submit a Report
          </Link>
        </div>
      ) : !loading && !error && (
        <motion.div className="space-y-3" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}>
          {reports.map((report) => (
            <motion.div key={report.id} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } } }}>
              <button onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)} className="w-full text-left">
                <ReportCard report={report} expanded={selectedReport?.id === report.id} />
              </button>
              {selectedReport?.id === report.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-1 ml-4 p-4 rounded-xl bg-[#12121A]/50 border border-[rgba(236,154,163,0.06)] space-y-3">
                  {/* Status Timeline */}
                  <div>
                    <p className="text-[9px] text-[#B6B8C4] uppercase font-bold mb-2">Status Progress</p>
                    <StatusTimeline currentStatus={report.status} />
                  </div>

                  {/* Acknowledgement */}
                  {report.acknowledgement && (
                    <div className="px-3 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                      <p className="text-[9px] text-emerald-400 font-bold uppercase mb-0.5">Officer Message</p>
                      <p className="text-xs text-[#F8F8FA]">{report.acknowledgement}</p>
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div><span className="text-[#B6B8C4]">Category:</span> <span className="text-[#F8F8FA]">{categoryLabels[report.type] || report.type}</span></div>
                    <div><span className="text-[#B6B8C4]">Priority:</span> <span className="text-[#F8F8FA] capitalize">{report.priority}</span></div>
                    <div><span className="text-[#B6B8C4]">Filed:</span> <span className="text-[#F8F8FA]">{new Date(report.createdAt).toLocaleDateString("en-IN")}</span></div>
                    <div><span className="text-[#B6B8C4]">Updated:</span> <span className="text-[#F8F8FA]">{new Date(report.updatedAt).toLocaleDateString("en-IN")}</span></div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {pagination && pagination.total > 0 && (
        <p className="text-[10px] text-[#B6B8C4]/50 text-center">Showing {reports.length} of {pagination.total} reports</p>
      )}
    </div>
  );
}

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const steps = ["submitted", "under_review", "investigating", "action_taken", "resolved"];
  const currentIdx = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const isActive = i <= currentIdx;
        const style = statusStyles[step] || statusStyles.submitted;
        return (
          <div key={step} className="flex items-center gap-1 flex-1">
            <div className={`w-2 h-2 rounded-full transition-all ${isActive ? style.bg : "bg-[#B6B8C4]/20"}`} />
            <span className={`text-[8px] truncate ${isActive ? style.color : "text-[#B6B8C4]/30"}`}>{style.label}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${isActive ? "bg-[rgba(236,154,163,0.2)]" : "bg-[#B6B8C4]/10"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function ReportCard({ report, expanded }: { report: ReportItem; expanded?: boolean }) {
  const date = new Date(report.createdAt);
  const formatted = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const style = statusStyles[report.status] || { bg: "bg-[#B6B8C4]", color: "text-[#B6B8C4]", label: report.status };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-150 ${expanded ? "bg-[#0D0D12] border-[rgba(236,154,163,0.15)]" : "bg-[#0D0D12]/80 border-[rgba(236,154,163,0.06)] hover:border-[rgba(236,154,163,0.15)]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-mono text-[#EC9AA3]">{report.reportNumber}</span>
            <span className="text-[10px] font-bold text-[#B6B8C4] uppercase">{categoryLabels[report.type] || report.type}</span>
          </div>
          <p className="text-xs text-[#F8F8FA] line-clamp-2">{report.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[9px] text-[#B6B8C4]/60">{formatted}</span>
            {report.attachments > 0 && <span className="text-[9px] text-[#B6B8C4]/60">📎 {report.attachments}</span>}
            {report.acknowledgement && <span className="text-[9px] text-emerald-400">✓ Acknowledged</span>}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          report.status === "resolved" || report.status === "action_taken" ? "border-emerald-500/20 bg-emerald-500/5" :
          report.status === "rejected" ? "border-red-500/20 bg-red-500/5" :
          report.status === "under_review" || report.status === "investigating" ? "border-amber-500/20 bg-amber-500/5" :
          "border-[rgba(236,154,163,0.1)] bg-[#12121A]"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} />
          <span className={`text-[9px] font-semibold ${style.color}`}>{style.label}</span>
        </div>
      </div>
    </div>
  );
}
