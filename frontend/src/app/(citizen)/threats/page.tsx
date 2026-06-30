"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { historyApi, type HistoryItemFull, type HistoryDetail, type HistoryTrends, type HistoryQuery } from "@/services/api/history";
import { Skeleton } from "@/components/ui";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const riskBg: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };
const riskText: Record<string, string> = { safe: "text-emerald-400", low: "text-emerald-300", medium: "text-amber-400", high: "text-orange-400", critical: "text-red-400" };

export default function ThreatHistoryPage() {
  const [items, setItems] = useState<HistoryItemFull[]>([]);
  const [trends, setTrends] = useState<HistoryTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchHistory = useCallback(async (cursor?: string) => {
    setLoading(true);
    try {
      const params: HistoryQuery = { sortBy, limit: 15 };
      if (search) params.search = search;
      if (riskFilter !== "all") params.riskLevel = riskFilter;
      if (typeFilter !== "all") params.scanType = typeFilter;
      if (dateRange !== "all") params.dateRange = dateRange;
      if (cursor) params.cursor = cursor;

      const res = await historyApi.getHistory(params);
      if (cursor) {
        setItems((prev) => [...prev, ...res.items]);
      } else {
        setItems(res.items);
      }
      setHasMore(res.pagination.hasMore);
      setNextCursor(res.pagination.nextCursor);
      setTotal(res.pagination.total);
    } catch {}
    setLoading(false);
  }, [search, riskFilter, typeFilter, dateRange, sortBy]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    historyApi.getTrends().then(setTrends).catch(() => {});
  }, []);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await historyApi.getDetail(id);
      setDetail(data);
    } catch {}
    setDetailLoading(false);
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Threat History</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">{total} total scans</p>
      </motion.div>

      {/* Trends */}
      {trends && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <TrendCard label="This Week" value={String(trends.weeklyScans)} />
          <TrendCard label="Highest Risk" value={String(trends.highestRiskScore)} color={trends.highestRiskScore >= 60 ? "text-red-400" : "text-amber-400"} />
          <TrendCard label="Most Common" value={trends.mostCommonThreat} />
          <TrendCard label="Top Type" value={trends.highestRiskType || "—"} />
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B6B8C4" strokeWidth="1.5" className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search URLs, phone numbers, UPI IDs..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-xs text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.1)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Filter value={dateRange} onChange={setDateRange} options={[["all","All Time"],["today","Today"],["7d","7 Days"],["30d","30 Days"]]} />
          <Filter value={riskFilter} onChange={setRiskFilter} options={[["all","All Risk"],["high","High"],["medium","Medium"],["low","Low"],["safe","Safe"]]} />
          <Filter value={typeFilter} onChange={setTypeFilter} options={[["all","All Types"],["message","Message"],["url","URL"],["upi","UPI"],["qr","QR"],["voice","Voice"]]} />
          <Filter value={sortBy} onChange={setSortBy} options={[["newest","Newest"],["oldest","Oldest"],["risk_high","Risk ↑"],["risk_low","Risk ↓"]]} />
        </div>
      </div>

      {/* Table */}
      {loading && items.length === 0 ? (
        <div className="space-y-3">{Array.from({length: 5}).map((_,i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm text-[#B6B8C4]">No scan history found.</p>
          <Link href="/scan" className="mt-4 px-5 py-2 rounded-lg text-xs font-semibold text-[#050508] bg-[#EC9AA3]">Start Scanning</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <motion.button
              key={item.id}
              onClick={() => openDetail(item.id)}
              className="w-full text-left px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] hover:border-[rgba(236,154,163,0.15)] transition-all duration-150"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.02, ease }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${riskBg[item.riskLevel] || "bg-[#B6B8C4]"}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#F8F8FA] truncate">{item.content || item.scanType}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-[#B6B8C4] uppercase">{item.scanType}</span>
                      <span className="text-[9px] text-[#B6B8C4]/50">{new Date(item.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm font-bold tabular-nums ${riskText[item.riskLevel] || "text-[#B6B8C4]"}`}>{item.riskScore}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B6B8C4" strokeWidth="1.5" className="opacity-40"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            </motion.button>
          ))}
          {hasMore && (
            <button onClick={() => fetchHistory(nextCursor || undefined)} disabled={loading} className="w-full py-2.5 rounded-lg text-xs font-medium text-[#EC9AA3] border border-[rgba(236,154,163,0.1)] hover:bg-[rgba(236,154,163,0.03)] transition-colors">
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      )}

      {/* Export */}
      {items.length > 0 && (
        <div className="flex gap-3 pt-2">
          <a href={historyApi.exportCsv()} target="_blank" rel="noopener" className="px-4 py-2 rounded-lg text-[11px] font-medium text-[#B6B8C4] border border-[rgba(236,154,163,0.1)] hover:text-[#F8F8FA] transition-colors">Export CSV</a>
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedId && (
          <motion.div className="fixed inset-0 z-50 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => { setSelectedId(null); setDetail(null); }} />
            <motion.div
              className="relative w-full max-w-md bg-[#0D0D12] border-l border-[rgba(236,154,163,0.08)] h-full overflow-y-auto p-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease }}
            >
              <button onClick={() => { setSelectedId(null); setDetail(null); }} className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#B6B8C4] hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.05)]">✕</button>

              {detailLoading ? (
                <div className="space-y-4 pt-8"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-24 w-full" /><Skeleton className="h-16 w-full" /></div>
              ) : detail ? (
                <div className="space-y-5 pt-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${riskBg[detail.riskLevel]}`} />
                      <span className={`text-sm font-bold capitalize ${riskText[detail.riskLevel]}`}>{detail.riskLevel} Risk</span>
                      <span className="text-xs text-[#B6B8C4]">•</span>
                      <span className="text-xs text-[#B6B8C4] uppercase">{detail.scanType}</span>
                    </div>
                    <p className="text-2xl font-bold text-[#F8F8FA] tabular-nums">{detail.riskScore}<span className="text-sm text-[#B6B8C4]">/100</span></p>
                  </div>

                  <div className="rounded-xl bg-[#12121A]/60 border border-[rgba(236,154,163,0.06)] p-4">
                    <h3 className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider mb-2">Original Input</h3>
                    <p className="text-xs text-[#F8F8FA] font-mono break-all leading-relaxed">{detail.content}</p>
                  </div>

                  {detail.summary && (
                    <div>
                      <h3 className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider mb-2">AI Explanation</h3>
                      <p className="text-xs text-[#B6B8C4] leading-relaxed">{detail.summary}</p>
                    </div>
                  )}

                  {detail.signals.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider mb-2">Detected Signals</h3>
                      <div className="space-y-2">
                        {detail.signals.map((s, i) => (
                          <div key={i} className="px-3 py-2 rounded-lg bg-[#12121A]/40 border border-[rgba(236,154,163,0.04)]">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium text-[#F8F8FA]">{s.label}</span>
                              <span className="text-[9px] text-[#B6B8C4] tabular-nums">{Math.round(s.confidence * 100)}%</span>
                            </div>
                            <p className="text-[10px] text-[#B6B8C4]/70 mt-0.5">{s.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail.recommendation && (
                    <div className="px-4 py-3 rounded-xl bg-[rgba(236,154,163,0.04)] border border-[rgba(236,154,163,0.1)]">
                      <h3 className="text-[10px] font-bold text-[#EC9AA3] uppercase tracking-wider mb-1">Recommendation</h3>
                      <p className="text-xs text-[#F8F8FA]">{detail.recommendation}</p>
                    </div>
                  )}

                  <p className="text-[9px] text-[#B6B8C4]/50 tabular-nums">
                    {new Date(detail.timestamp).toLocaleString("en-IN")} • {detail.processingTime}ms • Confidence: {Math.round(detail.confidence * 100)}%
                  </p>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrendCard({ label, value, color = "text-[#F8F8FA]" }: { label: string; value: string; color?: string }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)]">
      <p className={`text-lg font-bold capitalize ${color}`}>{value}</p>
      <p className="text-[9px] text-[#B6B8C4] uppercase">{label}</p>
    </div>
  );
}

function Filter({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#B6B8C4] bg-[#12121A] border border-[rgba(236,154,163,0.08)] focus:outline-none focus:border-[rgba(236,154,163,0.3)] appearance-none cursor-pointer">
      {options.map(([val, label]) => <option key={val} value={val} className="bg-[#0D0D12]">{label}</option>)}
    </select>
  );
}
