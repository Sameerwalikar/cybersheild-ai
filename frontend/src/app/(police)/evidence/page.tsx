"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
function getToken() { if (typeof window === "undefined") return null; return localStorage.getItem("accessToken"); }
async function api<T>(endpoint: string, opts?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed");
  return json.data as T;
}

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const RISK_DOT: Record<string, string> = {
  safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400",
  high: "bg-orange-400", critical: "bg-red-400",
};
const RISK_TEXT: Record<string, string> = {
  safe: "text-emerald-400", low: "text-emerald-300", medium: "text-amber-400",
  high: "text-orange-400", critical: "text-red-400",
};
const RISK_ROW: Record<string, string> = {
  critical: "bg-red-500/5 border-red-500/14 hover:border-red-500/22",
  high:     "bg-orange-500/4 border-orange-500/10 hover:border-orange-500/18",
  medium:   "bg-white/[0.012] border-[rgba(236,154,163,0.05)] hover:border-[rgba(236,154,163,0.14)]",
  safe:     "bg-white/[0.012] border-[rgba(236,154,163,0.04)] hover:border-[rgba(236,154,163,0.1)]",
  low:      "bg-white/[0.012] border-[rgba(236,154,163,0.04)] hover:border-[rgba(236,154,163,0.1)]",
};

const STATUS_OPTIONS = ["pending_review","under_review","investigating","action_taken","resolved","rejected"];

function rel(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

export default function EvidencePage() {
  const [items, setItems]                   = useState<any[]>([]);
  const [stats, setStats]                   = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [selected, setSelected]             = useState<any>(null);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [statusFilter, setStatusFilter]     = useState("all");
  const [actionLoading, setActionLoading]   = useState(false);
  const [ackMsg, setAckMsg]                 = useState("");
  const [noteText, setNoteText]             = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<any>(`/evidence/police/all${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`),
      api<any>("/evidence/police/stats"),
    ]).then(([list, s]) => { setItems(list.items); setStats(s); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try { setSelected(await api<any>(`/evidence/police/${id}`)); } catch {}
    setDetailLoading(false);
  };

  const handleAck = async (status: string) => {
    if (!selected || !ackMsg.trim()) return;
    setActionLoading(true);
    try {
      await api(`/evidence/police/${selected.id}/acknowledge`, {
        method: "POST", body: JSON.stringify({ message: ackMsg, status }),
      });
      setSelected((s: any) => s ? { ...s, acknowledgement: ackMsg, status } : s);
      setAckMsg("");
    } catch {} finally { setActionLoading(false); }
  };

  const handleNote = async () => {
    if (!selected || !noteText.trim()) return;
    setActionLoading(true);
    try {
      await api(`/evidence/police/${selected.id}/note`, {
        method: "POST", body: JSON.stringify({ note: noteText }),
      });
      const ts = new Date().toISOString();
      setSelected((s: any) => s ? { ...s, internalNotes: [...(s.internalNotes ?? []), `[${ts}] ${noteText}`] } : s);
      setNoteText("");
    } catch {} finally { setActionLoading(false); }
  };

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-red-400">{error}</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight">Evidence Intelligence</h1>
          <p className="mt-1 text-xs text-[#B6B8C4]/55 font-medium">
            Citizen-submitted evidence awaiting analysis and review.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: "Total Evidence",  value: stats.total,         color: "text-[#F8F8FA]" },
            { label: "Pending Review",  value: stats.pendingReview, color: "text-amber-400" },
            { label: "High Risk",       value: stats.highRisk,      color: "text-orange-400" },
            { label: "Critical",        value: stats.critical,      color: "text-red-400" },
          ].map(s => (
            <div key={s.label}
              className="px-4 py-4 rounded-2xl bg-[#0D0D14]/80 border border-[rgba(236,154,163,0.07)]
                hover:border-[rgba(236,154,163,0.16)] transition-[border-color] duration-200 text-center">
              <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[8px] text-[#B6B8C4]/50 uppercase tracking-[0.1em] mt-2">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Status filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {["all", ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold capitalize whitespace-nowrap
              transition-all duration-150
              ${statusFilter === s
                ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]"
                : "text-[#B6B8C4]/60 hover:text-[#F8F8FA] border border-transparent hover:border-[rgba(236,154,163,0.08)]"
              }`}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[72px] rounded-xl bg-[rgba(236,154,163,0.03)]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl opacity-10 mb-3">📎</span>
          <p className="text-sm font-semibold text-[#B6B8C4]/40">No evidence found</p>
          <p className="text-xs text-[#B6B8C4]/25 mt-1">
            Evidence submitted by citizens will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((e: any, i: number) => (
            <motion.button key={e.id} onClick={() => openDetail(e.id)}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.025, ease }}
              className={`w-full text-left px-4 py-3.5 rounded-xl border
                transition-[border-color,background-color] duration-150
                ${RISK_ROW[e.riskLevel] ?? RISK_ROW.low}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-[#F8F8FA] truncate">{e.filename}</span>
                    <span className="text-[8px] text-[#B6B8C4]/50 capitalize px-1.5 py-0.5 rounded-md
                      bg-[#12121A] border border-[rgba(236,154,163,0.06)] whitespace-nowrap">
                      {e.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#B6B8C4]/65">{e.citizenName}</span>
                    <span className="text-[9px] text-[#B6B8C4]/30">·</span>
                    <span className="text-[9px] text-[#B6B8C4]/45 font-mono">{e.mimeType}</span>
                    <span className="text-[9px] text-[#B6B8C4]/35 font-mono">{rel(e.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className={`w-2 h-2 rounded-full ${RISK_DOT[e.riskLevel] ?? "bg-[#B6B8C4]"}`} />
                  <span className={`text-sm font-black tabular-nums ${RISK_TEXT[e.riskLevel] ?? "text-[#F8F8FA]"}`}>
                    {e.riskScore}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {(selected || detailLoading) && (
          <motion.div className="fixed inset-0 z-50 flex justify-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease }}
              className="relative w-full max-w-[520px] bg-[#0A0A11]
                border-l border-[rgba(236,154,163,0.08)] h-full overflow-y-auto"
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#F8F8FA]">Evidence Detail</h2>
                  <button onClick={() => setSelected(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center
                      text-[#B6B8C4]/50 hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.07)]
                      transition-colors">
                    <CloseIcon />
                  </button>
                </div>

                {detailLoading && (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-10 rounded-xl bg-[rgba(236,154,163,0.04)]" />
                    ))}
                  </div>
                )}

                {selected && (
                  <>
                    {/* File header */}
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-[#F8F8FA] leading-snug">{selected.filename}</p>
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${RISK_DOT[selected.riskLevel] ?? "bg-[#B6B8C4]"}`} />
                        <span className={`text-sm font-black tabular-nums ${RISK_TEXT[selected.riskLevel] ?? "text-[#F8F8FA]"}`}>
                          {selected.riskScore}
                        </span>
                        <span className="text-xs text-[#B6B8C4]/60">/ 100 risk score</span>
                        <span className="text-xs text-[#B6B8C4]/45">
                          {Math.round((selected.confidence ?? 0) * 100)}% confidence
                        </span>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    {selected.visionSummary && (
                      <DS title="AI Vision Analysis">
                        <div className="px-3 py-2.5 rounded-xl bg-[rgba(236,154,163,0.04)]
                          border border-[rgba(236,154,163,0.08)]">
                          <p className="text-[11px] text-[#B6B8C4] leading-relaxed">{selected.visionSummary}</p>
                        </div>
                      </DS>
                    )}

                    {/* Citizen */}
                    <DS title="Submitted By">
                      <DR label="Name"  value={selected.citizenName} />
                      <DR label="Email" value={selected.citizenEmail} />
                      {selected.citizenPhone && <DR label="Phone" value={selected.citizenPhone} />}
                    </DS>

                    {/* Entities */}
                    {selected.detectedEntities?.length > 0 && (
                      <DS title="Detected Entities">
                        <div className="flex flex-wrap gap-1.5">
                          {(selected.detectedEntities as string[]).map((e, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg text-[9px] font-mono
                              bg-[rgba(236,154,163,0.07)] text-[#EC9AA3] border border-[rgba(236,154,163,0.1)]">
                              {e}
                            </span>
                          ))}
                        </div>
                      </DS>
                    )}

                    {/* Ack */}
                    {selected.acknowledgement && (
                      <DS title="Acknowledgement Sent">
                        <p className="text-[11px] text-emerald-400 font-medium">{selected.acknowledgement}</p>
                      </DS>
                    )}

                    {/* Notes */}
                    {selected.internalNotes?.length > 0 && (
                      <DS title="Internal Notes">
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {selected.internalNotes.map((n: string, i: number) => (
                            <p key={i} className="text-[10px] text-[#B6B8C4]/70 font-mono">{n}</p>
                          ))}
                        </div>
                      </DS>
                    )}

                    {/* Actions */}
                    <DS title="Actions">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] text-[#B6B8C4]/45 uppercase tracking-wider mb-2">
                            Acknowledge & Update Status
                          </p>
                          <input value={ackMsg} onChange={e => setAckMsg(e.target.value)}
                            placeholder="Message to citizen…"
                            className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#12121A]
                              border border-[rgba(236,154,163,0.08)] text-[#F8F8FA]
                              placeholder:text-[#B6B8C4]/30 focus:outline-none
                              focus:border-[rgba(236,154,163,0.3)] transition-colors mb-2" />
                          <div className="flex flex-wrap gap-1.5">
                            {STATUS_OPTIONS.map(s => (
                              <button key={s} onClick={() => handleAck(s)}
                                disabled={actionLoading || !ackMsg.trim()}
                                className="px-2.5 py-1.5 rounded-lg text-[9px] font-semibold capitalize
                                  bg-[#12121A] text-[#B6B8C4] border border-[rgba(236,154,163,0.07)]
                                  hover:text-[#F8F8FA] hover:border-[rgba(236,154,163,0.2)]
                                  disabled:opacity-30 transition-all">
                                {s.replace(/_/g, " ")}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] text-[#B6B8C4]/45 uppercase tracking-wider mb-2">Internal Note</p>
                          <div className="flex gap-2">
                            <input value={noteText} onChange={e => setNoteText(e.target.value)}
                              placeholder="Add investigation note…"
                              className="flex-1 px-3 py-2.5 rounded-xl text-xs bg-[#12121A]
                                border border-[rgba(236,154,163,0.08)] text-[#F8F8FA]
                                placeholder:text-[#B6B8C4]/30 focus:outline-none
                                focus:border-[rgba(236,154,163,0.3)] transition-colors" />
                            <button onClick={handleNote} disabled={actionLoading || !noteText.trim()}
                              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold
                                bg-[rgba(236,154,163,0.1)] text-[#EC9AA3]
                                border border-[rgba(236,154,163,0.15)]
                                disabled:opacity-40 hover:bg-[rgba(236,154,163,0.15)] transition-colors">
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </DS>
                  </>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DS({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold text-[#B6B8C4]/45 uppercase tracking-[0.1em]">{title}</p>
      <div className="rounded-xl bg-[#12121A]/60 border border-[rgba(236,154,163,0.05)] p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}
function DR({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[10px] text-[#B6B8C4]/55 flex-shrink-0">{label}</span>
      <span className="text-[10px] text-[#F8F8FA] text-right break-all">{value}</span>
    </div>
  );
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
