"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ReportCard, mockReports } from "@/components/history";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const statusFilters = ["all", "submitted", "under_review", "resolved", "rejected"];

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return mockReports;
    return mockReports.filter((r) => r.status === statusFilter);
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
          <p className="mt-1 text-sm text-[#B6B8C4]">Your submitted scam and fraud reports.</p>
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
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
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
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map((report) => (
            <motion.div key={report.id} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } } }}>
              <ReportCard report={report} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Export */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 pt-4 border-t border-[rgba(236,154,163,0.06)]">
          <button className="px-4 py-2 rounded-lg text-[11px] font-medium text-[#B6B8C4] border border-[rgba(236,154,163,0.1)] hover:border-[rgba(236,154,163,0.25)] hover:text-[#F8F8FA] transition-all">Download PDF</button>
          <button className="px-4 py-2 rounded-lg text-[11px] font-medium text-[#B6B8C4] border border-[rgba(236,154,163,0.1)] hover:border-[rgba(236,154,163,0.25)] hover:text-[#F8F8FA] transition-all">Export JSON</button>
        </div>
      )}
    </div>
  );
}
