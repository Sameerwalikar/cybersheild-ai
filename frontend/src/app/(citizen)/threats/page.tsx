"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { HistoryCard, HistoryFilters, mockHistory } from "@/components/history";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

export default function ThreatHistoryPage() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");

  const filtered = useMemo(() => {
    let items = [...mockHistory];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.contentPreview.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    if (riskFilter !== "all") items = items.filter((i) => i.riskLevel === riskFilter);
    if (typeFilter !== "all") items = items.filter((i) => i.scanType === typeFilter);

    items.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === "oldest") return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortBy === "highest") return b.riskScore - a.riskScore;
      return a.riskScore - b.riskScore;
    });

    return items;
  }, [search, riskFilter, typeFilter, sortBy]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Threat History</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Every scan you&apos;ve performed and its analysis.</p>
      </motion.div>

      {/* Search + filters + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <div className="relative flex-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B6B8C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scans..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.1)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors"
              aria-label="Search threat history"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <HistoryFilters riskFilter={riskFilter} typeFilter={typeFilter} sortBy={sortBy} onRiskChange={setRiskFilter} onTypeChange={setTypeFilter} onSortChange={setSortBy} />
          {/* View toggle */}
          <div className="flex rounded-lg border border-[rgba(236,154,163,0.08)] overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`px-2.5 py-1.5 text-[10px] font-medium transition-colors ${viewMode === "grid" ? "bg-[rgba(236,154,163,0.08)] text-[#EC9AA3]" : "text-[#B6B8C4] hover:text-[#F8F8FA]"}`} aria-label="Grid view">Grid</button>
            <button onClick={() => setViewMode("timeline")} className={`px-2.5 py-1.5 text-[10px] font-medium transition-colors ${viewMode === "timeline" ? "bg-[rgba(236,154,163,0.08)] text-[#EC9AA3]" : "text-[#B6B8C4] hover:text-[#F8F8FA]"}`} aria-label="Timeline view">Timeline</button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#12121A] border border-[rgba(236,154,163,0.08)] flex items-center justify-center mb-4 text-[#EC9AA3]/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <h3 className="text-sm font-semibold text-[#F8F8FA]">No scan history</h3>
          <p className="mt-1 text-xs text-[#B6B8C4]">Start your first scan to build your security timeline.</p>
          <Link href="/scan" className="mt-4 px-5 py-2 rounded-lg text-xs font-semibold text-[#050508] bg-[#EC9AA3] hover:shadow-[0_4px_12px_rgba(236,154,163,0.2)] transition-shadow">
            Start Scanning
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {filtered.map((item) => (
            <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } } }}>
              <HistoryCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="space-y-0 pl-4 border-l border-[rgba(236,154,163,0.1)]">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              className="relative pl-6 pb-4"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease }}
            >
              <div className="absolute left-0 top-2 -translate-x-[calc(50%+0.5px)] w-2.5 h-2.5 rounded-full border-2 border-[#0D0D12] bg-[#EC9AA3]/60" />
              <HistoryCard item={item} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Export UI */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 pt-4 border-t border-[rgba(236,154,163,0.06)]">
          <button className="px-4 py-2 rounded-lg text-[11px] font-medium text-[#B6B8C4] border border-[rgba(236,154,163,0.1)] hover:border-[rgba(236,154,163,0.25)] hover:text-[#F8F8FA] transition-all">Download PDF</button>
          <button className="px-4 py-2 rounded-lg text-[11px] font-medium text-[#B6B8C4] border border-[rgba(236,154,163,0.1)] hover:border-[rgba(236,154,163,0.25)] hover:text-[#F8F8FA] transition-all">Export JSON</button>
          <button className="px-4 py-2 rounded-lg text-[11px] font-medium text-[#B6B8C4] border border-[rgba(236,154,163,0.1)] hover:border-[rgba(236,154,163,0.25)] hover:text-[#F8F8FA] transition-all">Print Report</button>
        </div>
      )}
    </div>
  );
}
