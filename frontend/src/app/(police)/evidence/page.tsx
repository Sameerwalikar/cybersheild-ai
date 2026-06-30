"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
function getToken() { if (typeof window === "undefined") return null; return localStorage.getItem("accessToken"); }
async function api<T>(endpoint: string, opts?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers || {}) }, credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed");
  return json.data as T;
}

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const riskBg: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };
const statusOptions = ["pending_review", "under_review", "investigating", "action_taken", "resolved", "rejected"];

export default function EvidencePage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [ackMessage, setAckMessage] = useState("");
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<any>(`/evidence/police/all${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`),
      api<any>("/evidence/police/stats"),
    ]).then(([list, s]) => { setItems(list.items); setStats(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try { setSelected(await api<any>(`/evidence/police/${id}`)); } catch {}
    setDetailLoading(false);
  };

  const handleAcknowledge = async (status: string) => {
    if (!selected || !ackMessage.trim()) return;
    setActionLoading(true);
    try {
      await api(`/evidence/police/${selected.id}/acknowledge`, { method: "POST", body: JSON.stringify({ message: ackMessage, status }) });
      setSelected((s: any) => s ? { ...s, acknowledgement: ackMessage, status } : s);
      setAckMessage("");
    } catch {}
    setActionLoading(false);
  };

  const handleAddNote = async () => {
    if (!selected || !noteText.trim()) return;
    setActionLoading(true);
    try {
      await api(`/evidence/police/${selected.id}/note`, { method: "POST", body: JSON.stringify({ note: noteText }) });
      const ts = new Date().toISOString();
      setSelected((s: any) => s ? { ...s, internalNotes: [...(s.internalNotes || []), `[${ts}] ${noteText}`] } : s);
      setNoteText("");
    } catch {}
    setActionLoading(false);
  };

  if (error) return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-400">{error}</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Evidence Intelligence</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Citizen-submitted evidence awaiting analysis.</p>
      </motion.div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total" value={stats.total} />
          <Stat label="Pending Review" value={stats.pendingReview} color="text-amber-400" />
          <Stat label="High Risk" value={stats.highRisk} color="text-orange-400" />
          <Stat label="Critical" value={stats.critical} color="text-red-400" />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...statusOptions].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize whitespace-nowrap transition-all ${statusFilter === s ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]" : "text-[#B6B8C4] border border-transparent hover:bg-[rgba(236,154,163,0.03)]"}`}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? <div className="space-y-2">{Array.from({length:4}).map((_,i) => <div key={i} className="h-16 rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse" />)}</div> :
      items.length === 0 ? <p className="text-center text-xs text-[#B6B8C4]/60 py-12">No evidence found.</p> : (
        <div className="space-y-2">
          {items.map((e: any) => (
            <button key={e.id} onClick={() => openDetail(e.id)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-[rgba(236,154,163,0.15)] ${e.riskLevel === "critical" ? "bg-red-500/5 border-red-500/15" : e.riskLevel === "high" ? "bg-orange-500/3 border-orange-500/10" : "bg-[#0D0D12]/80 border-[rgba(236,154,163,0.06)]"}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#F8F8FA]">{e.filename}</span>
                    <span className="text-[8px] text-[#B6B8C4] capitalize px-1.5 py-0.5 rounded bg-[#12121A]">{e.status?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] text-[#B6B8C4]">{e.citizenName}</span>
                    <span className="text-[9px] text-[#B6B8C4]/50">{e.mimeType}</span>
                    <span className="text-[9px] text-[#B6B8C4]/50">{new Date(e.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${riskBg[e.riskLevel]}`} />
                  <span className="text-sm font-bold text-[#F8F8FA] tabular-nums">{e.riskScore}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {(selected || detailLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ duration: 0.3, ease }} className="relative w-full max-w-lg bg-[#0D0D12] border-l border-[rgba(236,154,163,0.1)] overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-[#F8F8FA]">Evidence Detail</h2><button onClick={() => setSelected(null)} className="text-[#B6B8C4] hover:text-[#F8F8FA] text-lg">×</button></div>
              {detailLoading ? <div className="space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="h-10 rounded-lg bg-[rgba(236,154,163,0.03)] animate-pulse" />)}</div> : selected && (
                <>
                  <div>
                    <p className="text-xs text-[#F8F8FA] font-medium">{selected.filename}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${riskBg[selected.riskLevel]}`} />
                      <span className="text-xs text-[#B6B8C4]">Risk: {selected.riskScore}/100</span>
                      <span className="text-xs text-[#B6B8C4]">Confidence: {Math.round((selected.confidence || 0) * 100)}%</span>
                    </div>
                  </div>

                  <DSection title="Citizen"><DRow label="Name" value={selected.citizenName} /><DRow label="Email" value={selected.citizenEmail} />{selected.citizenPhone && <DRow label="Phone" value={selected.citizenPhone} />}</DSection>

                  {selected.visionSummary && <DSection title="AI Analysis"><p className="text-[11px] text-[#B6B8C4] leading-relaxed">{selected.visionSummary}</p></DSection>}

                  {selected.detectedEntities?.length > 0 && (
                    <DSection title="Detected Entities">
                      <div className="flex flex-wrap gap-1.5">{(selected.detectedEntities as string[]).map((e, i) => <span key={i} className="px-2 py-0.5 rounded text-[9px] bg-[rgba(236,154,163,0.06)] text-[#EC9AA3]">{e}</span>)}</div>
                    </DSection>
                  )}

                  {selected.acknowledgement && <DSection title="Acknowledgement Sent"><p className="text-[11px] text-emerald-400">{selected.acknowledgement}</p></DSection>}

                  {selected.internalNotes?.length > 0 && (
                    <DSection title="Internal Notes">
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">{selected.internalNotes.map((n: string, i: number) => <p key={i} className="text-[10px] text-[#B6B8C4] font-mono">{n}</p>)}</div>
                    </DSection>
                  )}

                  <DSection title="Actions">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Acknowledge & Update Status</label>
                        <div className="flex gap-2">
                          <input value={ackMessage} onChange={(e) => setAckMessage(e.target.value)} placeholder="Message to citizen..." className="flex-1 px-3 py-2 rounded-lg text-[11px] bg-[#12121A] border border-[rgba(236,154,163,0.08)] text-[#F8F8FA] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)]" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {statusOptions.map((s) => (
                            <button key={s} onClick={() => handleAcknowledge(s)} disabled={actionLoading || !ackMessage.trim()} className="px-2 py-1 rounded text-[9px] font-medium bg-[#12121A] text-[#B6B8C4] hover:text-[#F8F8FA] border border-[rgba(236,154,163,0.08)] disabled:opacity-30 capitalize">{s.replace(/_/g, " ")}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Internal Note</label>
                        <div className="flex gap-2">
                          <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add note..." className="flex-1 px-3 py-2 rounded-lg text-[11px] bg-[#12121A] border border-[rgba(236,154,163,0.08)] text-[#F8F8FA] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)]" />
                          <button onClick={handleAddNote} disabled={actionLoading || !noteText.trim()} className="px-3 py-2 rounded-lg text-[10px] font-medium bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.15)] disabled:opacity-40">Add</button>
                        </div>
                      </div>
                    </div>
                  </DSection>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = "text-[#F8F8FA]" }: { label: string; value: number; color?: string }) {
  return <div className="px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] text-center"><p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p><p className="text-[9px] text-[#B6B8C4] uppercase mt-0.5">{label}</p></div>;
}
function DSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2"><h3 className="text-[9px] font-bold text-[#B6B8C4] uppercase tracking-wider">{title}</h3><div className="rounded-lg bg-[#12121A]/50 border border-[rgba(236,154,163,0.04)] p-3 space-y-1.5">{children}</div></div>;
}
function DRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3"><span className="text-[10px] text-[#B6B8C4]">{label}</span><span className="text-[10px] text-[#F8F8FA] text-right break-all">{value}</span></div>;
}
