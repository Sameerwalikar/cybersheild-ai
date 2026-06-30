"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { searchApi, type SearchResults, type SearchFilters } from "@/services/api/search";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const riskBg: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };
const statusColor: Record<string, string> = { new: "text-blue-400", submitted: "text-blue-400", under_review: "text-amber-400", investigating: "text-[#EC9AA3]", action_taken: "text-emerald-400", resolved: "text-emerald-300", archived: "text-[#B6B8C4]/50" };
const priorityBadge: Record<string, string> = { critical: "bg-red-500/20 text-red-400", high: "bg-orange-500/20 text-orange-400", medium: "bg-amber-500/20 text-amber-400", low: "bg-[#B6B8C4]/20 text-[#B6B8C4]" };
const typeIcons: Record<string, string> = { phone: "📞", email: "✉️", upi: "💳", domain: "🌐", url: "🔗", ip: "🖥️", bank_account: "🏦", qr_content: "📱" };

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});

  const doSearch = useCallback(async (q: string, f?: SearchFilters) => {
    if (q.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchApi.search(q, f || filters, 15);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    if (initialQuery.length >= 2) {
      doSearch(initialQuery);
    }
  }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    if (query.trim().length >= 2) {
      router.replace(`/search?q=${encodeURIComponent(query.trim())}`);
      doSearch(query.trim());
    }
  };

  const totalResults = results
    ? results.investigations.length + results.reports.length + results.scammers.length + results.graphNodes.length + results.timeline.length + results.evidence.length
    : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Intelligence Search</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Search across all CyberShield intelligence data.</p>
      </motion.div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B6B8C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search phone, email, UPI, domain, report ID, case ID..."
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:shadow-[0_0_0_3px_rgba(236,154,163,0.08)] transition-all"
          />
        </div>
        <button onClick={handleSearch} className="px-6 py-3 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] hover:shadow-[0_4px_12px_rgba(236,154,163,0.2)] active:scale-[0.97] transition-all">
          Search
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filters.status || ""} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value || undefined })); if (query.length >= 2) doSearch(query, { ...filters, status: e.target.value || undefined }); }} className="px-3 py-1.5 rounded-lg text-[10px] bg-[#0D0D12] border border-[rgba(236,154,163,0.08)] text-[#B6B8C4] focus:outline-none">
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <select value={filters.threatLevel || ""} onChange={(e) => { setFilters((f) => ({ ...f, threatLevel: e.target.value || undefined })); if (query.length >= 2) doSearch(query, { ...filters, threatLevel: e.target.value || undefined }); }} className="px-3 py-1.5 rounded-lg text-[10px] bg-[#0D0D12] border border-[rgba(236,154,163,0.08)] text-[#B6B8C4] focus:outline-none">
          <option value="">All Threat Levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select value={filters.category || ""} onChange={(e) => { setFilters((f) => ({ ...f, category: e.target.value || undefined })); if (query.length >= 2) doSearch(query, { ...filters, category: e.target.value || undefined }); }} className="px-3 py-1.5 rounded-lg text-[10px] bg-[#0D0D12] border border-[rgba(236,154,163,0.08)] text-[#B6B8C4] focus:outline-none">
          <option value="">All Categories</option>
          <option value="Phishing">Phishing</option>
          <option value="Financial Fraud">Financial Fraud</option>
          <option value="Identity Theft">Identity Theft</option>
          <option value="UPI Fraud">UPI Fraud</option>
          <option value="Vishing">Vishing</option>
        </select>
        {totalResults > 0 && <span className="text-[10px] text-[#B6B8C4] ml-auto">{totalResults} results found</span>}
      </div>

      {/* Loading */}
      {loading && <div className="space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="h-16 rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse" />)}</div>}

      {/* Error */}
      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {/* No results */}
      {!loading && results && totalResults === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-[#B6B8C4]">No results found for &quot;{initialQuery}&quot;</p>
          <p className="text-xs text-[#B6B8C4]/50 mt-1">Try a phone number, email, UPI ID, or report number.</p>
        </div>
      )}

      {/* Results */}
      {!loading && results && totalResults > 0 && (
        <div className="space-y-6">
          {/* Investigations */}
          {results.investigations.length > 0 && (
            <Section title={`Investigations (${results.investigations.length})`}>
              {results.investigations.map((inv) => (
                <button key={inv.id} onClick={() => router.push("/investigations")} className="w-full text-left px-4 py-3 rounded-lg bg-[#12121A]/40 hover:bg-[rgba(236,154,163,0.03)] transition-colors border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-[#EC9AA3]">{inv.incidentId}</span>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${priorityBadge[inv.priority]}`}>{inv.priority}</span>
                      <span className={`text-[9px] uppercase ${statusColor[inv.status]}`}>{inv.status.replace(/_/g, " ")}</span>
                    </div>
                    {inv.assignedOfficer && <span className="text-[8px] text-[#B6B8C4]">{inv.assignedOfficer}</span>}
                  </div>
                  <p className="text-xs text-[#F8F8FA] mt-1 truncate">{inv.title}</p>
                  {inv.description && <p className="text-[10px] text-[#B6B8C4] mt-0.5 truncate">{inv.description}</p>}
                </button>
              ))}
            </Section>
          )}

          {/* Reports */}
          {results.reports.length > 0 && (
            <Section title={`Reports (${results.reports.length})`}>
              {results.reports.map((r) => (
                <button key={r.id} onClick={() => router.push("/police-reports")} className="w-full text-left px-4 py-3 rounded-lg bg-[#12121A]/40 hover:bg-[rgba(236,154,163,0.03)] transition-colors border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-[#EC9AA3]">{r.reportNumber}</span>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${priorityBadge[r.priority]}`}>{r.priority}</span>
                      <span className={`text-[9px] uppercase ${statusColor[r.status]}`}>{r.status.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-[8px] text-[#B6B8C4]">{r.citizenName}</span>
                  </div>
                  <p className="text-xs text-[#F8F8FA] mt-1 truncate">{r.description}</p>
                  <span className="text-[8px] text-[#B6B8C4]/50">{r.category}</span>
                </button>
              ))}
            </Section>
          )}

          {/* Scammer Profiles */}
          {results.scammers.length > 0 && (
            <Section title={`Scammer Profiles (${results.scammers.length})`}>
              {results.scammers.map((s) => (
                <button key={s.id} onClick={() => router.push(`/network/scammer/${s.id}`)} className="w-full text-left px-4 py-3 rounded-lg bg-[#12121A]/40 hover:bg-[rgba(236,154,163,0.03)] transition-colors border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-[#F8F8FA] font-mono">{s.phones[0] || s.emails[0] || s.upiIds[0] || "Unknown"}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.phones.map((p, i) => <span key={`p${i}`} className="text-[8px] px-1.5 py-0.5 rounded bg-[rgba(236,154,163,0.06)] text-[#EC9AA3]">📞 {p}</span>)}
                        {s.emails.map((e, i) => <span key={`e${i}`} className="text-[8px] px-1.5 py-0.5 rounded bg-[rgba(236,154,163,0.06)] text-[#EC9AA3]">✉️ {e}</span>)}
                        {s.upiIds.map((u, i) => <span key={`u${i}`} className="text-[8px] px-1.5 py-0.5 rounded bg-[rgba(236,154,163,0.06)] text-[#EC9AA3]">💳 {u}</span>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${riskBg[s.threatLevel]}`} />
                      <span className="text-xs font-bold text-[#EC9AA3] tabular-nums">{s.occurrences}×</span>
                    </div>
                  </div>
                </button>
              ))}
            </Section>
          )}

          {/* Graph Entities */}
          {results.graphNodes.length > 0 && (
            <Section title={`Fraud Network Entities (${results.graphNodes.length})`}>
              {results.graphNodes.map((n) => (
                <button key={n.id} onClick={() => router.push("/network")} className="w-full text-left px-4 py-3 rounded-lg bg-[#12121A]/40 hover:bg-[rgba(236,154,163,0.03)] transition-colors border border-[rgba(236,154,163,0.04)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{typeIcons[n.entityType] || "📎"}</span>
                    <div>
                      <p className="text-xs text-[#F8F8FA] font-mono">{n.value}</p>
                      <p className="text-[8px] text-[#B6B8C4] uppercase">{n.entityType} • First: {new Date(n.firstSeen).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F8F8FA] tabular-nums">{n.occurrences}×</span>
                    <div className={`w-2 h-2 rounded-full ${riskBg[n.riskLevel]}`} />
                  </div>
                </button>
              ))}
            </Section>
          )}

          {/* Evidence */}
          {results.evidence.length > 0 && (
            <Section title={`Evidence (${results.evidence.length})`}>
              {results.evidence.map((e) => (
                <div key={e.id} className="px-4 py-3 rounded-lg bg-[#12121A]/40 border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#F8F8FA]">{e.filename}</p>
                      <p className="text-[8px] text-[#B6B8C4]">by {e.uploadedBy} • {new Date(e.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${riskBg[e.riskLevel]}`} />
                      {e.riskScore > 0 && <span className="text-xs font-bold text-[#F8F8FA] tabular-nums">{e.riskScore}</span>}
                    </div>
                  </div>
                  {e.visionSummary && <p className="text-[10px] text-[#B6B8C4] mt-1 truncate">{e.visionSummary}</p>}
                </div>
              ))}
            </Section>
          )}

          {/* Timeline */}
          {results.timeline.length > 0 && (
            <Section title={`Timeline Events (${results.timeline.length})`}>
              {results.timeline.map((t) => (
                <div key={t.id} className="px-4 py-2.5 rounded-lg bg-[#12121A]/40 border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[#F8F8FA]">{t.title}</p>
                    <span className={`text-[8px] font-bold uppercase ${t.severity === "critical" ? "text-red-400" : t.severity === "warning" ? "text-amber-400" : "text-blue-400"}`}>{t.severity}</span>
                  </div>
                  {t.description && <p className="text-[9px] text-[#B6B8C4] mt-0.5">{t.description}</p>}
                  <span className="text-[8px] text-[#B6B8C4]/50">{new Date(t.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] p-4">
      <h2 className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="space-y-4">{Array.from({length:4}).map((_,i) => <div key={i} className="h-16 rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse" />)}</div>}>
      <SearchContent />
    </Suspense>
  );
}
