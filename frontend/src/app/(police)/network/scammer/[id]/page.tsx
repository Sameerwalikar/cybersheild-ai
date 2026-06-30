"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { analyticsApi, type ScammerProfile, type ScammerTimelineEvent, type SimilarScammer } from "@/services/api/analytics";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const riskBg: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };
const riskText: Record<string, string> = { safe: "text-emerald-400", low: "text-emerald-300", medium: "text-amber-400", high: "text-orange-400", critical: "text-red-400" };
const statusColor: Record<string, string> = { submitted: "text-blue-400", under_review: "text-amber-400", investigating: "text-[#EC9AA3]", resolved: "text-emerald-400", rejected: "text-red-400/50" };

export default function ScammerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<ScammerProfile | null>(null);
  const [timeline, setTimeline] = useState<ScammerTimelineEvent[]>([]);
  const [similar, setSimilar] = useState<SimilarScammer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      analyticsApi.getScammer(id),
      analyticsApi.getScammerTimeline(id),
      analyticsApi.getScammerSimilar(id),
    ])
      .then(([p, t, s]) => { setProfile(p); setTimeline(t); setSimilar(s); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (error) return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-400">{error}</p></div>;
  if (loading) return <div className="space-y-4">{Array.from({length:5}).map((_,i)=><div key={i} className="h-20 rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse" />)}</div>;
  if (!profile) return <div className="text-center py-12 text-[#B6B8C4]">Scammer not found.</div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <button onClick={() => router.back()} className="text-[10px] text-[#EC9AA3] mb-2 hover:underline">← Back</button>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${riskBg[profile.threatLevel]}`} />
          <h1 className="text-xl font-bold text-[#F8F8FA]">Scammer Intelligence Profile</h1>
        </div>
        <p className="mt-1 text-sm text-[#B6B8C4] font-mono">{profile.phones[0] || profile.emails[0] || profile.upiIds[0] || "Unknown"}</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Threat Level" value={profile.threatLevel} isText color={riskText[profile.threatLevel]} />
        <StatCard label="Occurrences" value={String(profile.occurrences)} isText color="text-[#EC9AA3]" />
        <StatCard label="Reports" value={String(profile.totalReports)} isText />
        <StatCard label="Victims" value={String(profile.totalVictims)} isText color="text-amber-400" />
        <StatCard label="First Seen" value={new Date(profile.firstSeen).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })} isText />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Known Identifiers */}
        <Section title="Known Identifiers">
          <div className="space-y-3">
            {profile.phones.length > 0 && <IdentifierGroup label="Phone Numbers" items={profile.phones} />}
            {profile.emails.length > 0 && <IdentifierGroup label="Email Addresses" items={profile.emails} />}
            {profile.upiIds.length > 0 && <IdentifierGroup label="UPI IDs" items={profile.upiIds} />}
            {profile.domains.length > 0 && <IdentifierGroup label="Domains" items={profile.domains} />}
            {profile.urls.length > 0 && <IdentifierGroup label="URLs" items={profile.urls} />}
            {profile.walletIds.length > 0 && <IdentifierGroup label="Wallet IDs" items={profile.walletIds} />}
            {profile.aliases.length > 0 && <IdentifierGroup label="Known Aliases" items={profile.aliases} />}
          </div>
        </Section>

        {/* Linked Reports */}
        <Section title={`Linked Reports (${profile.reports.length})`}>
          {profile.reports.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {profile.reports.map((r) => (
                <div key={r.id} className="px-3 py-2 rounded-lg bg-[#12121A]/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#EC9AA3]">{r.reportNumber}</span>
                    <span className={`text-[9px] font-bold uppercase ${statusColor[r.status] || "text-[#B6B8C4]"}`}>{r.status.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-[10px] text-[#F8F8FA] mt-0.5 truncate">{r.description}</p>
                  <span className="text-[8px] text-[#B6B8C4]/50">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-[10px] text-[#B6B8C4]/50">No reports linked.</p>}
        </Section>

        {/* Timeline */}
        <Section title="Activity Timeline">
          {timeline.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {timeline.map((e) => (
                <div key={e.id} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#12121A]/30">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${e.severity === "critical" ? "bg-red-400" : e.severity === "warning" ? "bg-amber-400" : "bg-blue-400"}`} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#F8F8FA]">{e.title}</p>
                    {e.description && <p className="text-[9px] text-[#B6B8C4] truncate">{e.description}</p>}
                    <span className="text-[8px] text-[#B6B8C4]/50">{new Date(e.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-[10px] text-[#B6B8C4]/50">No timeline events.</p>}
        </Section>

        {/* Similar Scammers */}
        <Section title="Similar / Related Scammers">
          {similar.length > 0 ? (
            <div className="space-y-2">
              {similar.map((s) => (
                <button key={s.id} onClick={() => router.push(`/network/scammer/${s.id}`)} className="w-full text-left px-3 py-2.5 rounded-lg bg-[#12121A]/40 hover:bg-[rgba(236,154,163,0.03)] transition-colors border border-[rgba(236,154,163,0.04)]">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#F8F8FA] font-mono truncate">{s.primaryContact}</p>
                      <span className="text-[9px] text-[#B6B8C4]">{s.sharedEntities} shared entities</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold text-[#EC9AA3] tabular-nums">{s.similarity}%</span>
                      <div className={`w-2 h-2 rounded-full ${riskBg[s.threatLevel]}`} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : <p className="text-[10px] text-[#B6B8C4]/50">No similar profiles found.</p>}
        </Section>
      </div>
    </div>
  );
}

function StatCard({ label, value, isText, color = "text-[#F8F8FA]" }: { label: string; value: string; isText?: boolean; color?: string }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] text-center">
      <p className={`text-lg font-bold tabular-nums capitalize ${color}`}>{value}</p>
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

function IdentifierGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[9px] text-[#B6B8C4] uppercase mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono text-[#EC9AA3] bg-[rgba(236,154,163,0.06)] border border-[rgba(236,154,163,0.1)]">{item}</span>
        ))}
      </div>
    </div>
  );
}
