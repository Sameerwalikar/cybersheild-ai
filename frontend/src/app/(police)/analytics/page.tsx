"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { analyticsApi, type AnalyticsDashboard, type TrendsData, type TopIndicators, type ActivityEvent, type ScammerItem } from "@/services/api/analytics";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const riskBg: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };
const severityColor: Record<string, string> = { info: "text-blue-400", warning: "text-amber-400", critical: "text-red-400" };
const eventIcons: Record<string, string> = {
  REPORT_SUBMITTED: "📝", THREAT_SCAN: "🔍", REPORT_STATUS_CHANGE: "🔄", REPORT_ACKNOWLEDGED: "✉️",
  REPORT_ASSIGNED: "👮", REPORT_NOTE_ADDED: "📌", EVIDENCE_UPLOADED: "📎", INVESTIGATION_CREATED: "🗂️",
};

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [indicators, setIndicators] = useState<TopIndicators | null>(null);
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const [scammers, setScammers] = useState<ScammerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"phones" | "emails" | "upis" | "domains" | "urls">("phones");

  useEffect(() => {
    Promise.all([
      analyticsApi.getDashboard(),
      analyticsApi.getTrends(),
      analyticsApi.getTopIndicators(),
      analyticsApi.getActivityFeed(20),
      analyticsApi.getRepeatScammers(),
    ])
      .then(([d, t, i, f, s]) => {
        setDashboard(d);
        setTrends(t);
        setIndicators(i);
        setFeed(f);
        setScammers(s.items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-400">{error}</p></div>;
  if (loading) return <div className="space-y-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-24 rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Intelligence Center</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Real-time threat analytics and intelligence overview.</p>
      </motion.div>

      {/* Section A — Threat Overview */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <Stat label="Total Scans" value={dashboard.totalScans} />
          <Stat label="High Risk" value={dashboard.highRiskThreats} color="text-orange-400" />
          <Stat label="Critical" value={dashboard.criticalThreats} color="text-red-400" />
          <Stat label="Reports" value={dashboard.reportsSubmitted} />
          <Stat label="Active Cases" value={dashboard.activeInvestigations} color="text-emerald-400" />
          <Stat label="Evidence" value={dashboard.evidenceUploaded} />
          <Stat label="Repeat Scam" value={dashboard.repeatScammers} color="text-[#EC9AA3]" />
          <Stat label="New Victims" value={dashboard.newVictims} color="text-amber-400" />
        </div>
      )}

      {/* Section B — Threat Trends */}
      {trends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Scan Activity */}
          <Section title="Daily Threat Activity (30 days)">
            {trends.dailyScans.length > 0 ? (
              <div className="flex items-end gap-[2px] h-28">
                {trends.dailyScans.slice(-30).map((d, i) => {
                  const max = Math.max(...trends.dailyScans.map((x) => x.count), 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                      <div className="w-full rounded-t-sm bg-gradient-to-t from-[#EC9AA3]/70 to-[#EC9AA3]/25 transition-all group-hover:from-[#EC9AA3] group-hover:to-[#EC9AA3]/50" style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }} />
                      {i % 5 === 0 && <span className="text-[6px] text-[#B6B8C4]/40">{d.date.slice(5)}</span>}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block px-1.5 py-0.5 rounded bg-[#1a1a24] text-[8px] text-[#F8F8FA] whitespace-nowrap border border-[rgba(236,154,163,0.1)]">{d.count} scans</div>
                    </div>
                  );
                })}
              </div>
            ) : <Empty />}
          </Section>

          {/* Category Distribution */}
          <Section title="Threat Category Distribution">
            {trends.categoryDistribution.length > 0 ? (
              <div className="space-y-2.5">
                {trends.categoryDistribution.map((c) => {
                  const total = trends.categoryDistribution.reduce((a, b) => a + b.count, 0);
                  const pct = Math.round((c.count / Math.max(total, 1)) * 100);
                  return (
                    <div key={c.type} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#F8F8FA] uppercase">{c.type}</span>
                        <span className="text-[10px] text-[#B6B8C4] tabular-nums">{c.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#12121A]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#EC9AA3] to-[#EC9AA3]/40" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <Empty />}
          </Section>

          {/* Risk Distribution */}
          <Section title="Risk Level Distribution">
            {trends.riskDistribution.length > 0 ? (
              <div className="flex items-end justify-around h-28 gap-4">
                {["safe", "low", "medium", "high", "critical"].map((level) => {
                  const item = trends.riskDistribution.find((r) => r.level === level);
                  const count = item?.count || 0;
                  const max = Math.max(...trends.riskDistribution.map((r) => r.count), 1);
                  return (
                    <div key={level} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[10px] font-bold text-[#F8F8FA] tabular-nums">{count}</span>
                      <div className="w-full rounded-t-sm" style={{ height: `${Math.max(8, (count / max) * 80)}%`, background: level === "safe" ? "#34d399" : level === "low" ? "#6ee7b7" : level === "medium" ? "#fbbf24" : level === "high" ? "#fb923c" : "#f87171" }} />
                      <span className="text-[7px] text-[#B6B8C4] uppercase">{level}</span>
                    </div>
                  );
                })}
              </div>
            ) : <Empty />}
          </Section>

          {/* Weekly Reports */}
          <Section title="Weekly Report Volume">
            {trends.weeklyReports.length > 0 ? (
              <div className="flex items-end gap-3 h-28 justify-around">
                {trends.weeklyReports.map((w, i) => {
                  const max = Math.max(...trends.weeklyReports.map((x) => x.count), 1);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[9px] font-bold text-[#F8F8FA] tabular-nums">{w.count}</span>
                      <div className="w-full rounded-t-sm bg-gradient-to-t from-amber-400/70 to-amber-400/20" style={{ height: `${Math.max(12, (w.count / max) * 80)}%` }} />
                      <span className="text-[7px] text-[#B6B8C4]">W{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            ) : <Empty />}
          </Section>
        </div>
      )}

      {/* Section C — Top Indicators */}
      {indicators && (
        <Section title="Top Threat Indicators">
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {(["phones", "emails", "upis", "domains", "urls"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-lg text-[10px] font-medium capitalize whitespace-nowrap transition-all ${activeTab === tab ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]" : "text-[#B6B8C4] hover:text-[#F8F8FA]"}`}>
                {tab === "upis" ? "UPI IDs" : tab}
              </button>
            ))}
          </div>
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {indicators[activeTab].length > 0 ? indicators[activeTab].map((item) => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#12121A]/40 hover:bg-[rgba(236,154,163,0.03)] transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] text-[#B6B8C4] tabular-nums w-4">#{item.rank}</span>
                  <span className="text-[11px] text-[#F8F8FA] font-mono truncate">{item.value}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-[#EC9AA3] tabular-nums">{item.occurrences}×</span>
                  <div className={`w-2 h-2 rounded-full ${riskBg[item.riskLevel]}`} />
                </div>
              </div>
            )) : <Empty />}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section D — Intelligence Feed */}
        <Section title="Intelligence Feed">
          {feed.length > 0 ? (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {feed.map((e) => (
                <div key={e.id} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-[#12121A]/30">
                  <span className="text-sm flex-shrink-0 mt-0.5">{eventIcons[e.type] || "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-medium ${severityColor[e.severity] || "text-[#F8F8FA]"}`}>{e.title}</p>
                    {e.description && <p className="text-[9px] text-[#B6B8C4] mt-0.5 truncate">{e.description}</p>}
                    <span className="text-[8px] text-[#B6B8C4]/50">{new Date(e.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>

        {/* Section E — Repeat Offenders */}
        <Section title="Repeat Offenders">
          {scammers.length > 0 ? (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {scammers.map((s) => (
                <div key={s.id} className="px-3 py-2.5 rounded-lg bg-[#12121A]/40 border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#F8F8FA] font-mono truncate">{s.primaryContact}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] text-[#B6B8C4]">{s.totalReports} reports</span>
                        <span className="text-[8px] text-[#B6B8C4]">{s.occurrences}× seen</span>
                        {s.aliases.length > 0 && <span className="text-[8px] text-[#B6B8C4]">{s.aliases.length} aliases</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${riskBg[s.threatLevel]}`} />
                      <span className="text-xs font-bold text-[#EC9AA3] tabular-nums">{s.occurrences}×</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value, color = "text-[#F8F8FA]" }: { label: string; value: number; color?: string }) {
  return (
    <div className="px-3 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] text-center">
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[8px] text-[#B6B8C4] uppercase mt-0.5">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] p-4">
      <h2 className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-[10px] text-[#B6B8C4]/50 py-4 text-center">No data yet.</p>;
}
