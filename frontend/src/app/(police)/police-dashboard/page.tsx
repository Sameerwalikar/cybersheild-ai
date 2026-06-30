"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { policeApi } from "@/services/api/police";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const riskBg: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };
const statusColor: Record<string, string> = { active: "text-emerald-400", monitoring: "text-amber-400", resolved: "text-[#B6B8C4]", critical: "text-red-400", new: "text-blue-400", investigating: "text-[#EC9AA3]", submitted: "text-blue-400", under_review: "text-amber-400", action_taken: "text-emerald-400", rejected: "text-red-400/50", archived: "text-[#B6B8C4]/50" };
const priorityColor: Record<string, string> = { critical: "bg-red-500 text-white", high: "bg-orange-500/80 text-white", medium: "bg-amber-500/80 text-[#050508]", low: "bg-[#B6B8C4]/20 text-[#B6B8C4]" };

export default function PoliceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    policeApi.getDashboard()
      .then(setData)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-400">{error}</p></div>;
  if (loading) return <div className="space-y-4">{Array.from({length:5}).map((_,i)=><div key={i} className="h-20 rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse"/>)}</div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Police Command Center</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">National cyber intelligence overview.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Investigations" value={data.stats.totalInvestigations} />
        <StatCard label="Active" value={data.stats.activeInvestigations} color="text-emerald-400" />
        <StatCard label="Networks" value={data.stats.totalNetworks} />
        <StatCard label="Evidence" value={data.stats.totalEvidence} />
        <StatCard label="Threats Today" value={data.stats.threatsToday} color="text-[#EC9AA3]" />
        <StatCard label="Total Reports" value={data.stats.totalReports || 0} />
        <StatCard label="Pending" value={data.stats.pendingReports || 0} color="text-amber-400" />
      </div>

      {/* Critical Notifications */}
      {data.criticalNotifications?.length > 0 && (
        <Section title="⚠ Critical Alerts">
          <div className="space-y-2">
            {data.criticalNotifications.map((n: any) => (
              <div key={n.id} className="px-4 py-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
                <p className="text-xs font-medium text-red-400">{n.title}</p>
                <p className="text-[10px] text-[#B6B8C4] mt-0.5">{n.message}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Investigation Queue (citizen reports) — takes full width */}
      <Section title="🗂 Investigation Queue — Citizen Reports">
        {data.recentReports?.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {data.recentReports.map((r: any) => (
              <div key={r.id} className={`px-4 py-3 rounded-lg border transition-colors ${
                r.priority === "critical" ? "bg-red-500/5 border-red-500/20" :
                r.priority === "high" ? "bg-orange-500/5 border-orange-500/15" :
                "bg-[#12121A]/50 border-[rgba(236,154,163,0.04)]"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-mono text-[#EC9AA3]">{r.reportNumber}</span>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${priorityColor[r.priority] || priorityColor.medium}`}>{r.priority}</span>
                    <span className={`text-[9px] font-bold uppercase ${statusColor[r.status] || "text-[#B6B8C4]"}`}>{r.status.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-[8px] text-[#B6B8C4]/50 tabular-nums whitespace-nowrap">{new Date(r.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#F8F8FA] truncate">{r.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] text-[#B6B8C4]">{r.citizenName}</span>
                      <span className="text-[9px] text-[#B6B8C4]/60">{r.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty />}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Investigations */}
        <Section title="Recent Investigations">
          {data.recentInvestigations?.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {data.recentInvestigations.map((inv: any) => (
                <div key={inv.id} className="px-3 py-2.5 rounded-lg bg-[#12121A]/50 border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#EC9AA3]">{inv.caseId}</span>
                    <span className={`text-[9px] font-bold uppercase ${statusColor[inv.status] || "text-[#B6B8C4]"}`}>{inv.status}</span>
                  </div>
                  <p className="text-xs text-[#F8F8FA] mt-0.5 truncate">{inv.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {inv.city && <span className="text-[8px] text-[#B6B8C4]">{inv.city}</span>}
                    <span className="text-[8px] text-[#B6B8C4] tabular-nums">{inv.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>

        {/* High Risk Analyses */}
        <Section title="High Risk Analyses">
          {data.recentAnalyses?.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {data.recentAnalyses.map((a: any) => (
                <div key={a.id} className="px-3 py-2.5 rounded-lg bg-[#12121A]/50 border border-[rgba(236,154,163,0.04)] flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-[#F8F8FA] truncate">{a.summary}</p>
                    <span className="text-[9px] text-[#B6B8C4] uppercase">{a.scanType}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${riskBg[a.riskLevel]}`} />
                    <span className="text-sm font-bold text-[#F8F8FA] tabular-nums">{a.riskScore}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>

        {/* Recent Incidents */}
        <Section title="Recent Incidents">
          {data.recentIncidents?.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {data.recentIncidents.map((i: any) => (
                <div key={i.id} className="px-3 py-2.5 rounded-lg bg-[#12121A]/50 border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#EC9AA3]">{i.incidentId}</span>
                    <span className={`text-[9px] font-bold uppercase ${statusColor[i.status] || "text-[#B6B8C4]"}`}>{i.status}</span>
                  </div>
                  <p className="text-xs text-[#F8F8FA] mt-0.5 truncate">{i.title}</p>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>

        {/* Repeat Scammers */}
        <Section title="🔁 Repeat Scammers">
          {data.repeatScammers?.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {data.repeatScammers.map((s: any) => (
                <div key={s.id} className="px-3 py-2.5 rounded-lg bg-[#12121A]/50 border border-[rgba(236,154,163,0.04)] flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-[#F8F8FA] font-mono truncate">{s.primaryContact}</p>
                    <span className="text-[9px] text-[#B6B8C4] uppercase">{s.type} • {s.totalReports} reports</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${riskBg[s.threatLevel]}`} />
                    <span className="text-sm font-bold text-[#EC9AA3] tabular-nums">{s.occurrences}×</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Threat Categories */}
        <Section title="Top Threat Categories">
          {data.topThreatCategories?.length > 0 ? (
            <div className="space-y-2">
              {data.topThreatCategories.map((t: any) => (
                <div key={t.type} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#12121A]/30">
                  <span className="text-[11px] text-[#F8F8FA] uppercase">{t.type}</span>
                  <span className="text-xs font-bold text-[#EC9AA3] tabular-nums">{t.count}</span>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>

        {/* Fraud Networks */}
        <Section title="Fraud Networks">
          {data.recentNetworks?.length > 0 ? (
            <div className="space-y-2">
              {data.recentNetworks.map((n: any) => (
                <div key={n.id} className="px-3 py-2 rounded-lg bg-[#12121A]/30">
                  <p className="text-[11px] text-[#F8F8FA]">{n.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-[#B6B8C4]">{n.cities.join(", ")}</span>
                    <span className="text-[9px] text-[#EC9AA3] tabular-nums">{n.nodeCount} nodes</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>

        {/* City Breakdown */}
        <Section title="Threats by City">
          {data.cityBreakdown?.length > 0 ? (
            <div className="space-y-2">
              {data.cityBreakdown.map((c: any) => (
                <div key={c.city} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#12121A]/30">
                  <span className="text-[11px] text-[#F8F8FA]">{c.city || "Unknown"}</span>
                  <span className="text-xs font-bold text-[#F8F8FA] tabular-nums">{c.count}</span>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-[#F8F8FA]" }: { label: string; value: number; color?: string }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] text-center">
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[9px] text-[#B6B8C4] uppercase mt-0.5">{label}</p>
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
