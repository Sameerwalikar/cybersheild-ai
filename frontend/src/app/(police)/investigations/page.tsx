"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  incidentsApi,
  type IncidentSummary, type IncidentDetail, type IncidentStats,
} from "@/services/api/incidents";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

/* ─── Token maps ─────────────────────────────────────────────────────── */
const PRIORITY_PILL: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border border-red-500/25 ring-1 ring-red-500/15",
  high:     "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  medium:   "bg-amber-500/12 text-amber-400 border border-amber-500/20",
  low:      "bg-[#B6B8C4]/8 text-[#B6B8C4] border border-[#B6B8C4]/15",
};
const PRIORITY_ROW: Record<string, string> = {
  critical: "bg-red-500/5 border-red-500/14 hover:border-red-500/22",
  high:     "bg-orange-500/4 border-orange-500/10 hover:border-orange-500/18",
  medium:   "bg-white/[0.012] border-[rgba(236,154,163,0.05)] hover:border-[rgba(236,154,163,0.14)]",
  low:      "bg-white/[0.012] border-[rgba(236,154,163,0.04)] hover:border-[rgba(236,154,163,0.1)]",
};
const STATUS_DOT: Record<string, string> = {
  new: "bg-blue-400", under_review: "bg-amber-400",
  investigating: "bg-[#EC9AA3]", action_taken: "bg-purple-400",
  resolved: "bg-emerald-400", archived: "bg-[#B6B8C4]/40",
};
const STATUS_TEXT: Record<string, string> = {
  new: "text-blue-400", under_review: "text-amber-400",
  investigating: "text-[#EC9AA3]", action_taken: "text-purple-400",
  resolved: "text-emerald-400", archived: "text-[#B6B8C4]/40",
};
const RISK_DOT: Record<string, string> = {
  safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400",
  high: "bg-orange-400", critical: "bg-red-400",
};

const STATUS_FILTERS = ["all","new","under_review","investigating","action_taken","resolved","archived"];
const ACTIONS = ["UNDER_REVIEW","INVESTIGATING","ACTION_TAKEN","RESOLVED","ARCHIVED"];

function rel(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

export default function InvestigationsPage() {
  const [incidents, setIncidents]           = useState<IncidentSummary[]>([]);
  const [stats, setStats]                   = useState<IncidentStats | null>(null);
  const [statusFilter, setStatusFilter]     = useState("all");
  const [loading, setLoading]               = useState(true);
  const [selected, setSelected]             = useState<IncidentDetail | null>(null);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [showCreate, setShowCreate]         = useState(false);
  const [actionLoading, setActionLoading]   = useState(false);
  const [noteText, setNoteText]             = useState("");
  const [closeSummary, setCloseSummary]     = useState("");

  const reload = () => {
    incidentsApi.list({ status: statusFilter !== "all" ? statusFilter : undefined })
      .then(l => setIncidents(l.items)).catch(() => {});
    incidentsApi.getStats().then(setStats).catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      incidentsApi.list({ status: statusFilter !== "all" ? statusFilter : undefined }),
      incidentsApi.getStats(),
    ]).then(([l, s]) => { setIncidents(l.items); setStats(s); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try { setSelected(await incidentsApi.getById(id)); } catch {}
    setDetailLoading(false);
  };

  const refreshDetail = async () => {
    if (!selected) return;
    try { setSelected(await incidentsApi.getById(selected.id)); } catch {}
  };

  const handleStatus = async (s: string) => {
    if (!selected) return;
    setActionLoading(true);
    try { await incidentsApi.updateStatus(selected.id, s); await refreshDetail(); reload(); } catch {}
    setActionLoading(false);
  };

  const handleNote = async () => {
    if (!selected || !noteText.trim()) return;
    setActionLoading(true);
    try { await incidentsApi.addNote(selected.id, noteText); setNoteText(""); await refreshDetail(); } catch {}
    setActionLoading(false);
  };

  const handleClose = async () => {
    if (!selected || !closeSummary.trim()) return;
    setActionLoading(true);
    try { await incidentsApi.close(selected.id, closeSummary); setCloseSummary(""); await refreshDetail(); reload(); } catch {}
    setActionLoading(false);
  };

  if (error) return (
    <div className="flex h-64 items-center justify-center">
      <p className="text-sm text-red-400">{error}</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight">Investigation Workspace</h1>
          <p className="mt-1 text-xs text-[#B6B8C4]/55 font-medium">
            Manage cyber crime cases from creation to closure.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#050508] bg-[#EC9AA3]
            hover:bg-[#f3b3ba] hover:shadow-[0_4px_20px_rgba(236,154,163,0.3)]
            active:scale-[0.97] transition-all duration-150 flex-shrink-0">
          + New Investigation
        </button>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { label: "Total",          value: stats.total,        color: "text-[#F8F8FA]" },
            { label: "New",            value: stats.new,          color: "text-blue-400" },
            { label: "Investigating",  value: stats.investigating, color: "text-[#EC9AA3]" },
            { label: "Resolved",       value: stats.resolved,     color: "text-emerald-400" },
            { label: "Critical",       value: stats.critical,     color: "text-red-400" },
          ].map(s => (
            <div key={s.label}
              className="px-3 py-4 rounded-2xl bg-[#0D0D14]/80 border border-[rgba(236,154,163,0.07)]
                hover:border-[rgba(236,154,163,0.16)] transition-[border-color] duration-200 text-center">
              <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[8px] text-[#B6B8C4]/50 uppercase tracking-[0.1em] mt-2">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {STATUS_FILTERS.map(s => (
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

      {/* Incident list */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[72px] rounded-xl bg-[rgba(236,154,163,0.03)]" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl opacity-10 mb-3">🗂</span>
          <p className="text-sm font-semibold text-[#B6B8C4]/40">No investigations found</p>
          <p className="text-xs text-[#B6B8C4]/25 mt-1 max-w-xs">
            New citizen reports automatically generate investigation queue entries.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {incidents.map((inc, i) => (
            <motion.button key={inc.id} onClick={() => openDetail(inc.id)}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.025, ease }}
              className={`w-full text-left px-4 py-3.5 rounded-xl border
                transition-[border-color,background-color] duration-150 group
                ${PRIORITY_ROW[inc.priority] ?? PRIORITY_ROW.medium}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[inc.status] ?? "bg-[#B6B8C4]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-[9px] font-mono text-[#EC9AA3]/75">{inc.incidentId}</span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md
                      ${PRIORITY_PILL[inc.priority] ?? PRIORITY_PILL.medium}`}>
                      {inc.priority}
                    </span>
                    <span className={`text-[9px] font-semibold capitalize ${STATUS_TEXT[inc.status] ?? "text-[#B6B8C4]"}`}>
                      {inc.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#F8F8FA] truncate
                    group-hover:text-white transition-colors">
                    {inc.title}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <p className="text-[9px] text-[#B6B8C4]/55">
                    {inc.assignedOfficer || "Unassigned"}
                  </p>
                  <p className="text-[8px] text-[#B6B8C4]/35 font-mono">{rel(inc.updatedAt)}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); reload(); }}
        />
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {(selected || detailLoading) && (
          <motion.div className="fixed inset-0 z-50 flex justify-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setSelected(null)} />
            <motion.aside
              className="relative w-full max-w-[520px] bg-[#0A0A11]
                border-l border-[rgba(236,154,163,0.08)] h-full overflow-y-auto"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease }}
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#F8F8FA]">Investigation Detail</h2>
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
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-[#EC9AA3]/75">{selected.incidentId}</span>
                      <h3 className="text-base font-bold text-[#F8F8FA] leading-snug">{selected.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[selected.status]}`} />
                        <span className={`text-xs capitalize font-semibold ${STATUS_TEXT[selected.status]}`}>
                          {selected.status.replace(/_/g, " ")}
                        </span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md
                          ${PRIORITY_PILL[selected.priority]}`}>
                          {selected.priority}
                        </span>
                        {selected.assignedOfficer && (
                          <span className="text-xs text-[#B6B8C4]/55">· {selected.assignedOfficer.name}</span>
                        )}
                      </div>
                    </div>

                    {selected.description && (
                      <DS title="Description">
                        <p className="text-xs text-[#B6B8C4] leading-relaxed">{selected.description}</p>
                      </DS>
                    )}

                    {selected.resolutionSummary && (
                      <div className="px-3 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                        <p className="text-[9px] font-bold text-emerald-400 uppercase mb-1">Resolution</p>
                        <p className="text-xs text-[#B6B8C4]">{selected.resolutionSummary}</p>
                      </div>
                    )}

                    {selected.linkedReports.length > 0 && (
                      <DS title={`Linked Reports (${selected.linkedReports.length})`}>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {selected.linkedReports.map(r => (
                            <div key={r.id}
                              className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-[#12121A]/60">
                              <div className="min-w-0">
                                <span className="text-[9px] font-mono text-[#EC9AA3]/75 block">{r.reportNumber}</span>
                                <p className="text-[10px] text-[#F8F8FA] truncate">{r.description}</p>
                              </div>
                              <span className={`text-[8px] font-semibold capitalize flex-shrink-0 ml-2
                                ${STATUS_TEXT[r.status] ?? "text-[#B6B8C4]"}`}>
                                {r.status.replace(/_/g, " ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </DS>
                    )}

                    {selected.linkedScammers.length > 0 && (
                      <DS title={`Linked Scammers (${selected.linkedScammers.length})`}>
                        {selected.linkedScammers.map(s => (
                          <div key={s.id}
                            className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-[#12121A]/60">
                            <span className="text-[10px] text-[#F8F8FA] font-mono">
                              {s.phones[0] ?? s.emails[0] ?? s.upiIds[0]}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${RISK_DOT[s.threatLevel]}`} />
                              <span className="text-[9px] text-[#B6B8C4]/60">{s.occurrences}×</span>
                            </div>
                          </div>
                        ))}
                      </DS>
                    )}

                    {selected.linkedNodes.length > 0 && (
                      <DS title={`Evidence Entities (${selected.linkedNodes.length})`}>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.linkedNodes.map(n => (
                            <span key={n.id}
                              className="px-2 py-0.5 rounded-lg text-[9px] font-mono
                                text-[#EC9AA3] bg-[rgba(236,154,163,0.07)]
                                border border-[rgba(236,154,163,0.1)]">
                              {n.type}: {n.value}
                            </span>
                          ))}
                        </div>
                      </DS>
                    )}

                    {/* Actions */}
                    <DS title="Actions">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] text-[#B6B8C4]/45 uppercase tracking-wider mb-2">Update Status</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ACTIONS.map(s => (
                              <button key={s} onClick={() => handleStatus(s)}
                                disabled={actionLoading || selected.status === s.toLowerCase()}
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-semibold
                                  transition-all disabled:opacity-30
                                  ${selected.status === s.toLowerCase()
                                    ? "bg-[rgba(236,154,163,0.12)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]"
                                    : "bg-[#12121A] text-[#B6B8C4] border border-[rgba(236,154,163,0.07)] hover:text-[#F8F8FA] hover:border-[rgba(236,154,163,0.2)]"
                                  }`}>
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
                        {selected.status !== "resolved" && selected.status !== "archived" && (
                          <div>
                            <p className="text-[9px] text-[#B6B8C4]/45 uppercase tracking-wider mb-2">
                              Close Investigation
                            </p>
                            <div className="flex gap-2">
                              <input value={closeSummary} onChange={e => setCloseSummary(e.target.value)}
                                placeholder="Resolution summary…"
                                className="flex-1 px-3 py-2.5 rounded-xl text-xs bg-[#12121A]
                                  border border-[rgba(236,154,163,0.08)] text-[#F8F8FA]
                                  placeholder:text-[#B6B8C4]/30 focus:outline-none
                                  focus:border-emerald-500/30 transition-colors" />
                              <button onClick={handleClose} disabled={actionLoading || !closeSummary.trim()}
                                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold
                                  bg-emerald-500/15 text-emerald-400 border border-emerald-500/20
                                  disabled:opacity-40 hover:bg-emerald-500/20 transition-colors">
                                Close
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DS>

                    {/* Timeline */}
                    {selected.timeline.length > 0 && (
                      <DS title="Case Timeline">
                        <div className="space-y-3 pl-3 border-l border-[rgba(236,154,163,0.08)]
                          max-h-[220px] overflow-y-auto">
                          {selected.timeline.map(e => (
                            <div key={e.id} className="relative pl-4">
                              <div className="absolute left-0 top-1.5 -translate-x-[calc(50%+0.5px)]
                                w-1.5 h-1.5 rounded-full bg-[#EC9AA3]/40 border border-[#0A0A11]" />
                              <p className="text-[11px] text-[#F8F8FA] leading-snug">{e.description}</p>
                              <p className="text-[8px] text-[#B6B8C4]/35 mt-0.5 font-mono">
                                {new Date(e.timestamp).toLocaleString("en-IN", {
                                  day: "2-digit", month: "short",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </DS>
                    )}
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

/* ─── Create modal ───────────────────────────────────────────────────── */
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle]         = React.useState("");
  const [description, setDesc]    = React.useState("");
  const [priority, setPriority]   = React.useState("MEDIUM");
  const [creating, setCreating]   = React.useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await incidentsApi.create({ title, description: description || undefined, priority });
      onCreated();
    } catch {} finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-[#0A0A11]
          border border-[rgba(236,154,163,0.1)] rounded-2xl p-6 space-y-4
          shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
        <h2 className="text-base font-bold text-[#F8F8FA]">New Investigation</h2>
        <div className="space-y-3">
          <Field label="Title">
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Investigation title…"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#12121A]
                border border-[rgba(236,154,163,0.08)] text-[#F8F8FA]
                placeholder:text-[#B6B8C4]/30 focus:outline-none
                focus:border-[rgba(236,154,163,0.3)] transition-colors" />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={e => setDesc(e.target.value)}
              placeholder="Optional description…" rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#12121A]
                border border-[rgba(236,154,163,0.08)] text-[#F8F8FA]
                placeholder:text-[#B6B8C4]/30 focus:outline-none
                focus:border-[rgba(236,154,163,0.3)] resize-none transition-colors" />
          </Field>
          <Field label="Priority">
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#12121A]
                border border-[rgba(236,154,163,0.08)] text-[#F8F8FA]
                focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors">
              {["LOW","MEDIUM","HIGH","CRITICAL"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex gap-2.5 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#B6B8C4]
              border border-[rgba(236,154,163,0.1)]
              hover:text-[#F8F8FA] hover:border-[rgba(236,154,163,0.2)] transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!title.trim() || creating}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#050508]
              bg-[#EC9AA3] disabled:opacity-40
              hover:bg-[#f3b3ba] transition-colors">
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[9px] text-[#B6B8C4]/45 uppercase tracking-wider mb-1.5 block font-semibold">
        {label}
      </label>
      {children}
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

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
