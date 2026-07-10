"use client";

import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import {
  analyticsApi,
  type AnalyticsDashboard, type TrendsData,
  type TopIndicators, type ActivityEvent, type ScammerItem,
} from "@/services/api/analytics";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

/* ─── Color tokens ───────────────────────────────────────────────────── */
const RISK_DOT: Record<string, string> = {
  safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400",
  high: "bg-orange-400", critical: "bg-red-400",
};
const RISK_TEXT: Record<string, string> = {
  safe: "text-emerald-400", low: "text-emerald-300", medium: "text-amber-400",
  high: "text-orange-400", critical: "text-red-400",
};
const RISK_BAR: Record<string, string> = {
  safe: "#34d399", low: "#6ee7b7", medium: "#fbbf24",
  high: "#fb923c", critical: "#f87171",
};
const SEV_TEXT: Record<string, string> = {
  info: "text-blue-400", warning: "text-amber-400",
  critical: "text-red-400", error: "text-red-400",
};
const EVENT_ICON: Record<string, string> = {
  REPORT_SUBMITTED: "📝", THREAT_SCAN: "🔍", REPORT_STATUS_CHANGE: "🔄",
  REPORT_ACKNOWLEDGED: "✉️", REPORT_ASSIGNED: "👮", REPORT_NOTE_ADDED: "📌",
  EVIDENCE_UPLOADED: "📎", INVESTIGATION_CREATED: "🗂️",
};

/* ─── Panel wrapper ──────────────────────────────────────────────────── */
function Panel({ title, children, action }: {
  title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#0D0D14]/85 border border-[rgba(236,154,163,0.07)]
      hover:border-[rgba(236,154,163,0.13)] transition-[border-color] duration-200 p-4">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[10px] font-bold text-[#B6B8C4]/80 uppercase tracking-[0.08em]">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-[10px] text-[#B6B8C4]/35 py-6 text-center">No data available yet.</p>;
}

/* ─── KPI stat tile ──────────────────────────────────────────────────── */
function Stat({ label, value, color = "text-[#F8F8FA]" }: {
  label: string; value: number; color?: string;
}) {
  return (
    <div className="px-3 py-4 rounded-2xl bg-[#0D0D14]/80 border border-[rgba(236,154,163,0.07)]
      hover:border-[rgba(236,154,163,0.16)] transition-[border-color] duration-200 text-center">
      <p className={`text-2xl font-black tabular-nums leading-none ${color}`}>
        {value.toLocaleString()}
      </p>
      <p className="text-[8px] text-[#B6B8C4]/50 uppercase tracking-[0.1em] mt-2">{label}</p>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [dashboard, setDashboard]   = useState<AnalyticsDashboard | null>(null);
  const [trends, setTrends]         = useState<TrendsData | null>(null);
  const [indicators, setIndicators] = useState<TopIndicators | null>(null);
  const [feed, setFeed]             = useState<ActivityEvent[]>([]);
  const [scammers, setScammers]     = useState<ScammerItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<"phones" | "emails" | "upis" | "domains" | "urls">("phones");

  useEffect(() => {
    Promise.all([
      analyticsApi.getDashboard(),
      analyticsApi.getTrends(),
      analyticsApi.getTopIndicators(),
      analyticsApi.getActivityFeed(20),
      analyticsApi.getRepeatScammers(),
    ]).then(([d, t, i, f, s]) => {
      setDashboard(d); setTrends(t); setIndicators(i);
      setFeed(f); setScammers(s.items);
    }).catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-red-400">{error}</p>
    </div>
  );
  if (loading) return <AnalyticsSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight">Intelligence Center</h1>
        <p className="mt-1 text-xs text-[#B6B8C4]/60 font-medium">
          Real-time threat analytics and intelligence overview.
        </p>
      </motion.div>

      {/* ── Stats row ──────────────────────────────────────────────── */}
      {dashboard && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5"
        >
          <Stat label="Total Scans"    value={dashboard.totalScans} />
          <Stat label="High Risk"      value={dashboard.highRiskThreats}   color="text-orange-400" />
          <Stat label="Critical"       value={dashboard.criticalThreats}   color="text-red-400" />
          <Stat label="Reports"        value={dashboard.reportsSubmitted} />
          <Stat label="Active Cases"   value={dashboard.activeInvestigations} color="text-emerald-400" />
          <Stat label="Evidence"       value={dashboard.evidenceUploaded} />
          <Stat label="Repeat Scam"    value={dashboard.repeatScammers}   color="text-[#EC9AA3]" />
          <Stat label="New Victims"    value={dashboard.newVictims}        color="text-amber-400" />
        </motion.div>
      )}

      {/* ── Trend Charts ───────────────────────────────────────────── */}
      {trends && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <DailyActivity data={trends.dailyScans} />
          <CategoryDistribution data={trends.categoryDistribution} />
          <RiskDistribution data={trends.riskDistribution} />
          <WeeklyReports data={trends.weeklyReports} />
        </motion.div>
      )}

      {/* ── Top Indicators ─────────────────────────────────────────── */}
      {indicators && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease }}
        >
          <Panel title="Top Threat Indicators">
            <div className="flex gap-1.5 mb-3.5 overflow-x-auto pb-0.5">
              {(["phones", "emails", "upis", "domains", "urls"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold capitalize whitespace-nowrap
                    transition-all duration-150
                    ${activeTab === tab
                      ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]"
                      : "text-[#B6B8C4]/70 hover:text-[#F8F8FA] border border-transparent"
                    }`}
                >
                  {tab === "upis" ? "UPI IDs" : tab}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {indicators[activeTab].length > 0
                ? indicators[activeTab].map((item) => (
                  <div key={item.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl
                      bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                      hover:border-[rgba(236,154,163,0.1)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[9px] text-[#B6B8C4]/40 tabular-nums font-mono w-5">
                        #{item.rank}
                      </span>
                      <span className="text-[11px] text-[#F8F8FA] font-mono truncate">{item.value}</span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className="text-xs font-black text-[#EC9AA3] tabular-nums">
                        {item.occurrences}×
                      </span>
                      <span className={`w-2 h-2 rounded-full ${RISK_DOT[item.riskLevel] ?? "bg-[#B6B8C4]"}`} />
                    </div>
                  </div>
                ))
                : <Empty />}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* ── Feed & Scammers ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease }}
        >
          <IntelligenceFeed feed={feed} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22, ease }}
        >
          <RepeatOffendersPanel scammers={scammers} />
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Chart: Daily Activity ──────────────────────────────────────────── */
const DailyActivity = memo(function DailyActivity({
  data,
}: { data: { date: string; count: number }[] }) {
  const slice = data.slice(-30);
  const max   = Math.max(...slice.map(d => d.count), 1);
  return (
    <Panel title="Daily Threat Activity (30 days)">
      {slice.length > 0 ? (
        <div className="flex items-end gap-[2px] h-28" role="img" aria-label="Daily threat activity chart">
          {slice.map((d, i) => {
            const h = Math.max(4, (d.count / max) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-[#EC9AA3]/65 to-[#EC9AA3]/20
                    transition-all group-hover:from-[#EC9AA3]/90 group-hover:to-[#EC9AA3]/45"
                  style={{ height: `${h}%` }}
                />
                {i % 5 === 0 && (
                  <span className="text-[6px] text-[#B6B8C4]/35">{d.date.slice(5)}</span>
                )}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block
                  px-2 py-0.5 rounded bg-[#12121A] text-[8px] text-[#F8F8FA] whitespace-nowrap
                  border border-[rgba(236,154,163,0.12)] shadow-lg z-10">
                  {d.count} scans
                </div>
              </div>
            );
          })}
        </div>
      ) : <Empty />}
    </Panel>
  );
});

/* ─── Chart: Category Distribution ──────────────────────────────────── */
const CategoryDistribution = memo(function CategoryDistribution({
  data,
}: { data: { type: string; count: number }[] }) {
  const total = data.reduce((a, b) => a + b.count, 0);
  return (
    <Panel title="Threat Category Distribution">
      {data.length > 0 ? (
        <div className="space-y-2.5">
          {data.map((c) => {
            const pct = Math.round((c.count / Math.max(total, 1)) * 100);
            return (
              <div key={c.type} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#F8F8FA] uppercase font-medium">{c.type}</span>
                  <span className="text-[10px] text-[#B6B8C4]/60 tabular-nums">{c.count} ({pct}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#0D0D14]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#EC9AA3] to-[#EC9AA3]/35"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : <Empty />}
    </Panel>
  );
});

/* ─── Chart: Risk Distribution ───────────────────────────────────────── */
const RiskDistribution = memo(function RiskDistribution({
  data,
}: { data: { level: string; count: number }[] }) {
  const levels = ["safe", "low", "medium", "high", "critical"];
  const max = Math.max(...data.map(r => r.count), 1);
  return (
    <Panel title="Risk Level Distribution">
      {data.length > 0 ? (
        <div className="flex items-end justify-around h-28 gap-3"
          role="img" aria-label="Risk level distribution chart">
          {levels.map((level) => {
            const item  = data.find(r => r.level === level);
            const count = item?.count ?? 0;
            const h     = Math.max(8, (count / max) * 80);
            return (
              <div key={level} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] font-bold text-[#F8F8FA] tabular-nums">{count}</span>
                <div className="w-full rounded-t-sm transition-all"
                  style={{ height: `${h}%`, backgroundColor: RISK_BAR[level] }} />
                <span className="text-[7px] text-[#B6B8C4]/50 uppercase">{level}</span>
              </div>
            );
          })}
        </div>
      ) : <Empty />}
    </Panel>
  );
});

/* ─── Chart: Weekly Reports ──────────────────────────────────────────── */
const WeeklyReports = memo(function WeeklyReports({
  data,
}: { data: { week: string; count: number }[] }) {
  const max = Math.max(...data.map(w => w.count), 1);
  return (
    <Panel title="Weekly Report Volume">
      {data.length > 0 ? (
        <div className="flex items-end gap-3 h-28 justify-around"
          role="img" aria-label="Weekly report volume chart">
          {data.map((w, i) => {
            const h = Math.max(12, (w.count / max) * 80);
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[9px] font-bold text-[#F8F8FA] tabular-nums">{w.count}</span>
                <div className="w-full rounded-t-sm bg-gradient-to-t from-amber-400/70 to-amber-400/20"
                  style={{ height: `${h}%` }} />
                <span className="text-[7px] text-[#B6B8C4]/50">W{i + 1}</span>
              </div>
            );
          })}
        </div>
      ) : <Empty />}
    </Panel>
  );
});

/* ─── Intelligence Feed ──────────────────────────────────────────────── */
const IntelligenceFeed = memo(function IntelligenceFeed({ feed }: { feed: ActivityEvent[] }) {
  return (
    <Panel title="Intelligence Feed">
      {feed.length > 0 ? (
        <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
          {feed.map((e) => (
            <div key={e.id}
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl
                bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                hover:border-[rgba(236,154,163,0.1)] transition-colors"
            >
              <span className="text-sm flex-shrink-0 mt-0.5">{EVENT_ICON[e.type] ?? "📋"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-semibold leading-snug ${SEV_TEXT[e.severity] ?? "text-[#F8F8FA]"}`}>
                  {e.title}
                </p>
                {e.description && (
                  <p className="text-[9px] text-[#B6B8C4]/60 mt-0.5 truncate">{e.description}</p>
                )}
                <span className="text-[8px] text-[#B6B8C4]/35 font-mono">
                  {new Date(e.timestamp).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty />}
    </Panel>
  );
});

/* ─── Repeat Offenders Panel ─────────────────────────────────────────── */
const RepeatOffendersPanel = memo(function RepeatOffendersPanel({
  scammers,
}: { scammers: ScammerItem[] }) {
  return (
    <Panel title="Repeat Offenders">
      {scammers.length > 0 ? (
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {scammers.map((s) => (
            <div key={s.id}
              className="px-3 py-2.5 rounded-xl bg-white/[0.012]
                border border-[rgba(236,154,163,0.04)] hover:border-[rgba(236,154,163,0.1)] transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-[#F8F8FA] font-mono truncate">{s.primaryContact}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] text-[#B6B8C4]/50">{s.totalReports} reports</span>
                    <span className="text-[8px] text-[#B6B8C4]/35">·</span>
                    <span className="text-[8px] text-[#B6B8C4]/50">{s.occurrences}× seen</span>
                    {s.aliases.length > 0 && (
                      <>
                        <span className="text-[8px] text-[#B6B8C4]/35">·</span>
                        <span className="text-[8px] text-[#B6B8C4]/50">{s.aliases.length} aliases</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${RISK_DOT[s.threatLevel] ?? "bg-[#B6B8C4]"}`} />
                  <span className="text-xs font-black text-[#EC9AA3] tabular-nums">{s.occurrences}×</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty />}
    </Panel>
  );
});

/* ─── Skeleton ───────────────────────────────────────────────────────── */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-52 rounded-xl bg-[rgba(236,154,163,0.07)]" />
        <div className="h-2.5 w-60 rounded-full bg-[rgba(236,154,163,0.04)]" />
      </div>
      <div className="grid grid-cols-8 gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-2xl bg-[rgba(236,154,163,0.04)]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-[rgba(236,154,163,0.03)]" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-[rgba(236,154,163,0.03)]" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-72 rounded-2xl bg-[rgba(236,154,163,0.03)]" />
        ))}
      </div>
    </div>
  );
}
