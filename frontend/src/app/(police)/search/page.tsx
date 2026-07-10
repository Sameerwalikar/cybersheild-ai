"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { searchApi, type SearchResults, type SearchFilters } from "@/services/api/search";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const RISK_DOT: Record<string, string> = {
  safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400",
  high: "bg-orange-400", critical: "bg-red-400",
};
const STATUS_TEXT: Record<string, string> = {
  new: "text-blue-400", submitted: "text-blue-400", under_review: "text-amber-400",
  investigating: "text-[#EC9AA3]", action_taken: "text-emerald-400",
  resolved: "text-emerald-300", archived: "text-[#B6B8C4]/40",
};
const PRIORITY_PILL: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border border-red-500/25",
  high:     "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  medium:   "bg-amber-500/12 text-amber-400 border border-amber-500/20",
  low:      "bg-[#B6B8C4]/8 text-[#B6B8C4] border border-[#B6B8C4]/15",
};
const TYPE_ICON: Record<string, string> = {
  phone: "📞", email: "✉️", upi: "💳", domain: "🌐",
  url: "🔗", ip: "🖥️", bank_account: "🏦", qr_content: "📱",
};

function SearchContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const initialQuery  = searchParams.get("q") ?? "";

  const [query, setQuery]       = useState(initialQuery);
  const [results, setResults]   = useState<SearchResults | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [filters, setFilters]   = useState<SearchFilters>({});

  const doSearch = useCallback(async (q: string, f?: SearchFilters) => {
    if (q.length < 2) return;
    setLoading(true); setError(null);
    try { setResults(await searchApi.search(q, f ?? filters, 15)); }
    catch (err: any) { setError(err.message); }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    if (initialQuery.length >= 2) doSearch(initialQuery);
  }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    if (query.trim().length >= 2) {
      router.replace(`/search?q=${encodeURIComponent(query.trim())}`);
      doSearch(query.trim());
    }
  };

  const total = results
    ? results.investigations.length + results.reports.length + results.scammers.length +
      results.graphNodes.length + results.timeline.length + results.evidence.length
    : 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight">Intelligence Search</h1>
        <p className="mt-1 text-xs text-[#B6B8C4]/55 font-medium">
          Search across all CyberShield intelligence — reports, scammers, evidence, investigations.
        </p>
      </motion.div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B6B8C4"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search phone, email, UPI, domain, report ID, case ID…"
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D14]
              border border-[rgba(236,154,163,0.12)] placeholder:text-[#B6B8C4]/35
              focus:outline-none focus:border-[rgba(236,154,163,0.4)]
              focus:shadow-[0_0_0_3px_rgba(236,154,163,0.07)] transition-all" />
        </div>
        <button onClick={handleSearch}
          className="px-6 py-3 rounded-xl text-sm font-bold text-[#050508] bg-[#EC9AA3]
            hover:shadow-[0_4px_16px_rgba(236,154,163,0.25)] active:scale-[0.97] transition-all">
          Search
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={filters.status ?? ""} label="All Statuses"
          options={[
            { value: "SUBMITTED", label: "Submitted" }, { value: "UNDER_REVIEW", label: "Under Review" },
            { value: "INVESTIGATING", label: "Investigating" }, { value: "RESOLVED", label: "Resolved" },
          ]}
          onChange={v => { const f = { ...filters, status: v || undefined }; setFilters(f); if (query.length >= 2) doSearch(query, f); }}
        />
        <FilterSelect
          value={filters.threatLevel ?? ""} label="All Threat Levels"
          options={[
            { value: "CRITICAL", label: "Critical" }, { value: "HIGH", label: "High" },
            { value: "MEDIUM", label: "Medium" }, { value: "LOW", label: "Low" },
          ]}
          onChange={v => { const f = { ...filters, threatLevel: v || undefined }; setFilters(f); if (query.length >= 2) doSearch(query, f); }}
        />
        <FilterSelect
          value={filters.category ?? ""} label="All Categories"
          options={[
            { value: "Phishing", label: "Phishing" }, { value: "Financial Fraud", label: "Financial Fraud" },
            { value: "Identity Theft", label: "Identity Theft" }, { value: "UPI Fraud", label: "UPI Fraud" },
            { value: "Vishing", label: "Vishing" },
          ]}
          onChange={v => { const f = { ...filters, category: v || undefined }; setFilters(f); if (query.length >= 2) doSearch(query, f); }}
        />
        {total > 0 && (
          <span className="ml-auto text-[10px] text-[#B6B8C4]/45 font-mono">
            {total} result{total !== 1 ? "s" : ""} found
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[72px] rounded-xl bg-[rgba(236,154,163,0.03)]" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* No results */}
      {!loading && results && total === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl opacity-10 mb-3">🔍</span>
          <p className="text-sm font-semibold text-[#B6B8C4]/40">
            No results for &quot;{initialQuery}&quot;
          </p>
          <p className="text-xs text-[#B6B8C4]/25 mt-1">
            Try a phone number, email address, UPI ID, domain, or report number.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results && total > 0 && (
        <div className="space-y-5">
          {/* Investigations */}
          {results.investigations.length > 0 && (
            <ResultSection title="Investigations" count={results.investigations.length}>
              {results.investigations.map(inv => (
                <button key={inv.id} onClick={() => router.push("/investigations")}
                  className="w-full text-left px-4 py-3 rounded-xl
                    bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                    hover:border-[rgba(236,154,163,0.15)] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-mono text-[#EC9AA3]/75">{inv.incidentId}</span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${PRIORITY_PILL[inv.priority]}`}>
                        {inv.priority}
                      </span>
                      <span className={`text-[9px] uppercase font-semibold ${STATUS_TEXT[inv.status]}`}>
                        {inv.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {inv.assignedOfficer && (
                      <span className="text-[8px] text-[#B6B8C4]/50">{inv.assignedOfficer}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#F8F8FA] mt-1 truncate">{inv.title}</p>
                  {inv.description && (
                    <p className="text-[10px] text-[#B6B8C4]/55 mt-0.5 truncate">{inv.description}</p>
                  )}
                </button>
              ))}
            </ResultSection>
          )}

          {/* Reports */}
          {results.reports.length > 0 && (
            <ResultSection title="Reports" count={results.reports.length}>
              {results.reports.map(r => (
                <button key={r.id} onClick={() => router.push("/police-reports")}
                  className="w-full text-left px-4 py-3 rounded-xl
                    bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                    hover:border-[rgba(236,154,163,0.15)] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-mono text-[#EC9AA3]/75">{r.reportNumber}</span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${PRIORITY_PILL[r.priority]}`}>
                        {r.priority}
                      </span>
                      <span className={`text-[9px] uppercase font-semibold ${STATUS_TEXT[r.status]}`}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-[8px] text-[#B6B8C4]/50">{r.citizenName}</span>
                  </div>
                  <p className="text-xs text-[#F8F8FA] mt-1 truncate">{r.description}</p>
                  {r.category && (
                    <span className="text-[8px] text-[#B6B8C4]/40 uppercase">{r.category}</span>
                  )}
                </button>
              ))}
            </ResultSection>
          )}

          {/* Scammers */}
          {results.scammers.length > 0 && (
            <ResultSection title="Scammer Profiles" count={results.scammers.length}>
              {results.scammers.map(s => (
                <button key={s.id} onClick={() => router.push(`/network/scammer/${s.id}`)}
                  className="w-full text-left px-4 py-3 rounded-xl
                    bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                    hover:border-[rgba(236,154,163,0.15)] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-[#F8F8FA] font-mono">
                        {s.phones[0] ?? s.emails[0] ?? s.upiIds[0] ?? "Unknown"}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.phones.map((p, i) => (
                          <span key={`p${i}`} className="text-[8px] px-1.5 py-0.5 rounded-lg
                            bg-[rgba(236,154,163,0.07)] text-[#EC9AA3]">📞 {p}</span>
                        ))}
                        {s.emails.map((e, i) => (
                          <span key={`e${i}`} className="text-[8px] px-1.5 py-0.5 rounded-lg
                            bg-[rgba(236,154,163,0.07)] text-[#EC9AA3]">✉️ {e}</span>
                        ))}
                        {s.upiIds.map((u, i) => (
                          <span key={`u${i}`} className="text-[8px] px-1.5 py-0.5 rounded-lg
                            bg-[rgba(236,154,163,0.07)] text-[#EC9AA3]">💳 {u}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${RISK_DOT[s.threatLevel] ?? "bg-[#B6B8C4]"}`} />
                      <span className="text-xs font-black text-[#EC9AA3] tabular-nums">{s.occurrences}×</span>
                    </div>
                  </div>
                </button>
              ))}
            </ResultSection>
          )}

          {/* Graph nodes */}
          {results.graphNodes.length > 0 && (
            <ResultSection title="Fraud Network Entities" count={results.graphNodes.length}>
              {results.graphNodes.map(n => (
                <button key={n.id} onClick={() => router.push("/network")}
                  className="w-full text-left px-4 py-3 rounded-xl
                    bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                    hover:border-[rgba(236,154,163,0.15)] transition-colors
                    flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{TYPE_ICON[n.entityType] ?? "📎"}</span>
                    <div>
                      <p className="text-xs text-[#F8F8FA] font-mono">{n.value}</p>
                      <p className="text-[8px] text-[#B6B8C4]/50 uppercase">
                        {n.entityType} · first: {new Date(n.firstSeen).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-[#F8F8FA] tabular-nums">{n.occurrences}×</span>
                    <span className={`w-2 h-2 rounded-full ${RISK_DOT[n.riskLevel] ?? "bg-[#B6B8C4]"}`} />
                  </div>
                </button>
              ))}
            </ResultSection>
          )}

          {/* Evidence */}
          {results.evidence.length > 0 && (
            <ResultSection title="Evidence" count={results.evidence.length}>
              {results.evidence.map(e => (
                <div key={e.id}
                  className="px-4 py-3 rounded-xl bg-white/[0.012]
                    border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#F8F8FA] font-semibold">{e.filename}</p>
                      <p className="text-[8px] text-[#B6B8C4]/50 mt-0.5">
                        by {e.uploadedBy} · {new Date(e.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`w-2 h-2 rounded-full ${RISK_DOT[e.riskLevel] ?? "bg-[#B6B8C4]"}`} />
                      {e.riskScore > 0 && (
                        <span className="text-xs font-bold text-[#F8F8FA] tabular-nums">{e.riskScore}</span>
                      )}
                    </div>
                  </div>
                  {e.visionSummary && (
                    <p className="text-[10px] text-[#B6B8C4]/55 mt-1.5 truncate">{e.visionSummary}</p>
                  )}
                </div>
              ))}
            </ResultSection>
          )}

          {/* Timeline */}
          {results.timeline.length > 0 && (
            <ResultSection title="Timeline Events" count={results.timeline.length}>
              {results.timeline.map(t => (
                <div key={t.id}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.012]
                    border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[#F8F8FA] font-medium">{t.title}</p>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md
                      ${t.severity === "critical" ? "bg-red-500/15 text-red-400"
                      : t.severity === "warning" ? "bg-amber-500/15 text-amber-400"
                      : "bg-blue-500/15 text-blue-400"}`}>
                      {t.severity}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-[9px] text-[#B6B8C4]/55 mt-0.5">{t.description}</p>
                  )}
                  <span className="text-[8px] text-[#B6B8C4]/35 font-mono">
                    {new Date(t.timestamp).toLocaleString("en-IN", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */
function FilterSelect({
  value, label, options, onChange,
}: {
  value: string;
  label: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg text-[10px] bg-[#0D0D14]
        border border-[rgba(236,154,163,0.08)] text-[#B6B8C4]
        focus:outline-none focus:border-[rgba(236,154,163,0.25)] transition-colors">
      <option value="">{label}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ResultSection({ title, count, children }: {
  title: string; count: number; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease }}
      className="rounded-2xl bg-[#0D0D14]/85 border border-[rgba(236,154,163,0.07)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-bold text-[#B6B8C4]/80 uppercase tracking-[0.08em]">{title}</h2>
        <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black
          bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.15)]">
          {count}
        </span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </motion.div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[rgba(236,154,163,0.03)]" />
        ))}
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
