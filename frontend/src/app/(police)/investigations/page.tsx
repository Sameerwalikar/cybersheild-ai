"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { incidentsApi, type IncidentSummary, type IncidentDetail, type IncidentStats } from "@/services/api/incidents";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const priorityColors: Record<string, string> = { low: "text-[#B6B8C4]", medium: "text-amber-400", high: "text-orange-400", critical: "text-red-400" };
const priorityBadge: Record<string, string> = { low: "bg-[#B6B8C4]/20 text-[#B6B8C4]", medium: "bg-amber-500/20 text-amber-400", high: "bg-orange-500/20 text-orange-400", critical: "bg-red-500/20 text-red-400" };
const statusColors: Record<string, string> = { new: "bg-blue-400", under_review: "bg-amber-400", investigating: "bg-[#EC9AA3]", action_taken: "bg-purple-400", resolved: "bg-emerald-400", archived: "bg-[#B6B8C4]" };
const riskBg: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };

export default function InvestigationsPage() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IncidentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [closeSummary, setCloseSummary] = useState("");

  const reload = () => {
    incidentsApi.list({ status: statusFilter !== "all" ? statusFilter : undefined })
      .then((list) => setIncidents(list.items)).catch(() => {});
    incidentsApi.getStats().then(setStats).catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      incidentsApi.list({ status: statusFilter !== "all" ? statusFilter : undefined }),
      incidentsApi.getStats(),
    ]).then(([list, s]) => { setIncidents(list.items); setStats(s); })
      .catch((err) => setError(err.message))
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

  const handleStatusChange = async (status: string) => {
    if (!selected) return;
    setActionLoading(true);
    try { await incidentsApi.updateStatus(selected.id, status); await refreshDetail(); reload(); } catch {}
    setActionLoading(false);
  };

  const handleAddNote = async () => {
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

  if (error) return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-400">{error}</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#F8F8FA]">Investigation Workspace</h1>
          <p className="mt-1 text-sm text-[#B6B8C4]">Manage cyber crime investigations from creation to closure.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[#050508] bg-[#EC9AA3] hover:shadow-[0_4px_12px_rgba(236,154,163,0.2)] active:scale-[0.97] transition-all">
          + New Investigation
        </button>
      </motion.div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="New" value={stats.new} color="text-blue-400" />
          <StatCard label="Investigating" value={stats.investigating} color="text-[#EC9AA3]" />
          <StatCard label="Resolved" value={stats.resolved} color="text-emerald-400" />
          <StatCard label="Critical" value={stats.critical} color="text-red-400" />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "new", "under_review", "investigating", "action_taken", "resolved", "archived"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize whitespace-nowrap transition-all ${statusFilter === s ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]" : "text-[#B6B8C4] border border-transparent hover:bg-[rgba(236,154,163,0.03)]"}`}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{Array.from({length:4}).map((_,i) => <div key={i} className="h-16 rounded-lg bg-[rgba(236,154,163,0.03)] animate-pulse" />)}</div>
      ) : incidents.length === 0 ? (
        <p className="text-center text-xs text-[#B6B8C4]/60 py-12">No investigations found.</p>
      ) : (
        <div className="space-y-2">
          {incidents.map((inc) => (
            <button key={inc.id} onClick={() => openDetail(inc.id)} className="w-full text-left px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] hover:border-[rgba(236,154,163,0.15)] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusColors[inc.status] || "bg-[#B6B8C4]"}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-[#EC9AA3]">{inc.incidentId}</span>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${priorityBadge[inc.priority]}`}>{inc.priority}</span>
                    </div>
                    <p className="text-xs text-[#F8F8FA] truncate mt-0.5">{inc.title}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[9px] text-[#B6B8C4] capitalize">{inc.status.replace(/_/g, " ")}</p>
                  <p className="text-[8px] text-[#B6B8C4]/50">{inc.assignedOfficer || "Unassigned"}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); reload(); }} />}

      {/* Detail Drawer */}
      <AnimatePresence>
        {(selected || detailLoading) && (
          <motion.div className="fixed inset-0 z-50 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
            <motion.div className="relative w-full max-w-xl bg-[#0D0D12] border-l border-[rgba(236,154,163,0.08)] h-full overflow-y-auto" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease }}>
              <div className="p-6 space-y-5">
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#B6B8C4] hover:text-[#F8F8FA]">✕</button>

                {detailLoading ? (
                  <div className="space-y-4 pt-8">{Array.from({length:4}).map((_,i) => <div key={i} className="h-12 bg-[rgba(236,154,163,0.03)] rounded animate-pulse" />)}</div>
                ) : selected ? (
                  <>
                    {/* Header */}
                    <div>
                      <span className="text-[9px] font-mono text-[#EC9AA3]">{selected.incidentId}</span>
                      <h2 className="text-lg font-bold text-[#F8F8FA] mt-1">{selected.title}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <div className={`w-2 h-2 rounded-full ${statusColors[selected.status]}`} />
                        <span className="text-xs text-[#B6B8C4] capitalize">{selected.status.replace(/_/g, " ")}</span>
                        <span className={`text-xs font-bold uppercase ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                        {selected.assignedOfficer && <span className="text-xs text-[#B6B8C4]">• {selected.assignedOfficer.name}</span>}
                      </div>
                    </div>

                    {selected.description && <DSection title="Description"><p className="text-xs text-[#B6B8C4] leading-relaxed">{selected.description}</p></DSection>}
                    {selected.resolutionSummary && <div className="px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15"><p className="text-[9px] font-bold text-emerald-400 uppercase mb-1">Resolution</p><p className="text-xs text-[#B6B8C4]">{selected.resolutionSummary}</p></div>}

                    {/* Linked Reports */}
                    {selected.linkedReports.length > 0 && (
                      <DSection title={`Linked Reports (${selected.linkedReports.length})`}>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {selected.linkedReports.map((r) => (
                            <div key={r.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-[#12121A]/40">
                              <div className="min-w-0"><span className="text-[9px] font-mono text-[#EC9AA3]">{r.reportNumber}</span><p className="text-[10px] text-[#F8F8FA] truncate">{r.description}</p></div>
                              <span className="text-[8px] text-[#B6B8C4] capitalize flex-shrink-0 ml-2">{r.status.replace(/_/g, " ")}</span>
                            </div>
                          ))}
                        </div>
                      </DSection>
                    )}

                    {/* Linked Scammers */}
                    {selected.linkedScammers.length > 0 && (
                      <DSection title={`Linked Scammers (${selected.linkedScammers.length})`}>
                        <div className="space-y-1.5">
                          {selected.linkedScammers.map((s) => (
                            <div key={s.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-[#12121A]/40">
                              <span className="text-[10px] text-[#F8F8FA] font-mono">{s.phones[0] || s.emails[0] || s.upiIds[0]}</span>
                              <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${riskBg[s.threatLevel]}`} /><span className="text-[9px] text-[#B6B8C4]">{s.occurrences}×</span></div>
                            </div>
                          ))}
                        </div>
                      </DSection>
                    )}

                    {/* Linked Graph Nodes */}
                    {selected.linkedNodes.length > 0 && (
                      <DSection title={`Evidence Entities (${selected.linkedNodes.length})`}>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.linkedNodes.map((n) => (
                            <span key={n.id} className="px-2 py-0.5 rounded text-[9px] font-mono text-[#EC9AA3] bg-[rgba(236,154,163,0.06)]">{n.type}: {n.value}</span>
                          ))}
                        </div>
                      </DSection>
                    )}

                    {/* Actions */}
                    <DSection title="Actions">
                      <div className="space-y-3">
                        {/* Status */}
                        <div>
                          <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Status</label>
                          <div className="flex flex-wrap gap-1.5">
                            {["UNDER_REVIEW", "INVESTIGATING", "ACTION_TAKEN", "RESOLVED", "ARCHIVED"].map((s) => (
                              <button key={s} onClick={() => handleStatusChange(s)} disabled={actionLoading || selected.status === s.toLowerCase()} className={`px-2 py-1 rounded text-[9px] font-medium transition-all disabled:opacity-30 ${selected.status === s.toLowerCase() ? "bg-[#EC9AA3]/20 text-[#EC9AA3]" : "bg-[#12121A] text-[#B6B8C4] hover:text-[#F8F8FA] border border-[rgba(236,154,163,0.08)]"}`}>
                                {s.replace(/_/g, " ")}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Add Note */}
                        <div>
                          <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Internal Note</label>
                          <div className="flex gap-2">
                            <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add investigation note..." className="flex-1 px-3 py-2 rounded-lg text-[11px] bg-[#12121A] border border-[rgba(236,154,163,0.08)] text-[#F8F8FA] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)]" />
                            <button onClick={handleAddNote} disabled={actionLoading || !noteText.trim()} className="px-3 py-2 rounded-lg text-[10px] font-medium bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.15)] disabled:opacity-40">Add</button>
                          </div>
                        </div>

                        {/* Close Investigation */}
                        {selected.status !== "resolved" && selected.status !== "archived" && (
                          <div>
                            <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Close Investigation</label>
                            <div className="flex gap-2">
                              <input value={closeSummary} onChange={(e) => setCloseSummary(e.target.value)} placeholder="Resolution summary..." className="flex-1 px-3 py-2 rounded-lg text-[11px] bg-[#12121A] border border-[rgba(236,154,163,0.08)] text-[#F8F8FA] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)]" />
                              <button onClick={handleClose} disabled={actionLoading || !closeSummary.trim()} className="px-3 py-2 rounded-lg text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 disabled:opacity-40">Close</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DSection>

                    {/* Timeline */}
                    {selected.timeline.length > 0 && (
                      <DSection title="Case Timeline">
                        <div className="space-y-2 pl-3 border-l border-[rgba(236,154,163,0.08)] max-h-[250px] overflow-y-auto">
                          {selected.timeline.map((e) => (
                            <div key={e.id} className="relative pl-4">
                              <div className="absolute left-0 top-1.5 -translate-x-[calc(50%+0.5px)] w-2 h-2 rounded-full bg-[#EC9AA3]/60 border border-[#0D0D12]" />
                              <p className="text-[11px] text-[#F8F8FA]">{e.description}</p>
                              <p className="text-[8px] text-[#B6B8C4]/50">{new Date(e.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          ))}
                        </div>
                      </DSection>
                    )}

                    <p className="text-[9px] text-[#B6B8C4]/40">Created: {new Date(selected.createdAt).toLocaleString("en-IN")}</p>
                  </>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await incidentsApi.create({ title, description: description || undefined, priority });
      onCreated();
    } catch {}
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-[#0D0D12] border border-[rgba(236,154,163,0.1)] rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#F8F8FA]">New Investigation</h2>
        <div>
          <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Investigation title..." className="w-full px-3 py-2.5 rounded-lg text-xs bg-[#12121A] border border-[rgba(236,154,163,0.08)] text-[#F8F8FA] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)]" />
        </div>
        <div>
          <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." className="w-full h-20 px-3 py-2.5 rounded-lg text-xs bg-[#12121A] border border-[rgba(236,154,163,0.08)] text-[#F8F8FA] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)] resize-none" />
        </div>
        <div>
          <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-xs bg-[#12121A] border border-[rgba(236,154,163,0.08)] text-[#F8F8FA] focus:outline-none">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-xs font-medium text-[#B6B8C4] border border-[rgba(236,154,163,0.1)] hover:text-[#F8F8FA]">Cancel</button>
          <button onClick={handleCreate} disabled={!title.trim() || creating} className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-[#050508] bg-[#EC9AA3] disabled:opacity-40">Create</button>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, color = "text-[#F8F8FA]" }: { label: string; value: number; color?: string }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] text-center">
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[9px] text-[#B6B8C4] uppercase">{label}</p>
    </div>
  );
}

function DSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[9px] font-bold text-[#B6B8C4] uppercase tracking-wider">{title}</h3>
      <div className="rounded-lg bg-[#12121A]/50 border border-[rgba(236,154,163,0.04)] p-3">{children}</div>
    </div>
  );
}
