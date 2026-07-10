"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { policeApi, type PoliceReportItem, type PoliceReportDetail } from "@/services/api/police";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

/* ─── Token maps ─────────────────────────────────────────────────────── */
const STATUS_DOT: Record<string, string> = {
  submitted: "bg-blue-400", under_review: "bg-amber-400",
  investigating: "bg-[#EC9AA3]", action_taken: "bg-emerald-400",
  resolved: "bg-emerald-300", rejected: "bg-red-400/60", archived: "bg-[#B6B8C4]/40",
};
const STATUS_TEXT: Record<string, string> = {
  submitted: "text-blue-400", under_review: "text-amber-400",
  investigating: "text-[#EC9AA3]", action_taken: "text-emerald-400",
  resolved: "text-emerald-300", rejected: "text-red-400/60", archived: "text-[#B6B8C4]/40",
};
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

const STATUS_FILTERS = ["all","SUBMITTED","UNDER_REVIEW","INVESTIGATING","ACTION_TAKEN","RESOLVED","REJECTED","ARCHIVED"];
const PRIORITY_FILTERS = ["all","CRITICAL","HIGH","MEDIUM","LOW"];
const STATUS_ACTIONS = ["UNDER_REVIEW","INVESTIGATING","ACTION_TAKEN","RESOLVED","REJECTED"];

function rel(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

export default function PoliceReportsPage() {
  const [reports, setReports]           = useState<PoliceReportItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priFilter, setPriFilter]       = useState("all");
  const [detail, setDetail]             = useState<PoliceReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [ackMsg, setAckMsg]             = useState("");
  const [noteText, setNoteText]         = useState("");

  useEffect(() => {
    setLoading(true);
    policeApi.getReports({
      status:   statusFilter !== "all" ? statusFilter : undefined,
      priority: priFilter !== "all" ? priFilter : undefined,
    }).then(d => setReports(d.items))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, priFilter]);

  const openDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try { setDetail(await policeApi.getReport(id)); } catch {}
    setDetailLoading(false);
  }, []);

  const closeDetail = useCallback(() => {
    setDetail(null); setAckMsg(""); setNoteText("");
  }, []);

  const handleStatus = async (s: string) => {
    if (!detail) return;
    setActionLoading(true);
    try {
      await policeApi.updateReportStatus(detail.id, s);
      setDetail(d => d ? { ...d, status: s.toLowerCase() } : d);
      setReports(prev => prev.map(r => r.id === detail.id ? { ...r, status: s.toLowerCase() } : r));
    } catch {} finally { setActionLoading(false); }
  };

  const handleAck = async () => {
    if (!detail || !ackMsg.trim()) return;
    setActionLoading(true);
    try {
      await policeApi.acknowledgeReport(detail.id, ackMsg);
      setDetail(d => d ? { ...d, acknowledgement: ackMsg } : d);
      setAckMsg("");
    } catch {} finally { setActionLoading(false); }
  };

  const handleNote = async () => {
    if (!detail || !noteText.trim()) return;
    setActionLoading(true);
    try {
      await policeApi.addReportNote(detail.id, noteText);
      const ts = new Date().toISOString();
      setDetail(d => d ? { ...d, internalNotes: [...d.internalNotes, `[${ts}] ${noteText}`] } : d);
      setNoteText("");
    } catch {} finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight">Citizen Reports</h1>
          <p className="mt-1 text-xs text-[#B6B8C4]/55 font-medium">
            Manage and investigate submitted citizen reports.
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease }}
        className="flex flex-wrap gap-3 items-center"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-[#B6B8C4]/45 uppercase tracking-widest font-semibold">Status</span>
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all duration-150
                  ${statusFilter === s
                    ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]"
                    : "text-[#B6B8C4]/60 hover:text-[#F8F8FA] border border-transparent hover:border-[rgba(236,154,163,0.08)]"
                  }`}
              >
                {s === "all" ? "All" : s.toLowerCase().replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-[#B6B8C4]/45 uppercase tracking-widest font-semibold">Priority</span>
          <div className="flex gap-1">
            {PRIORITY_FILTERS.map(p => (
              <button key={p} onClick={() => setPriFilter(p)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all duration-150
                  ${priFilter === p
                    ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]"
                    : "text-[#B6B8C4]/60 hover:text-[#F8F8FA] border border-transparent hover:border-[rgba(236,154,163,0.08)]"
                  }`}
              >
                {p === "all" ? "All" : p.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        {reports.length > 0 && (
          <span className="ml-auto text-[10px] text-[#B6B8C4]/40 font-mono">
            {reports.length} report{reports.length !== 1 ? "s" : ""}
          </span>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[76px] rounded-xl bg-[rgba(236,154,163,0.03)]" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl opacity-10 mb-3">📋</span>
          <p className="text-sm font-semibold text-[#B6B8C4]/40">No reports match the filters</p>
          <p className="text-xs text-[#B6B8C4]/25 mt-1 max-w-xs">
            Adjust the status or priority filter to find specific reports.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {reports.map((r, i) => (
            <motion.button key={r.id} onClick={() => openDetail(r.id)}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.025, ease }}
              className={`w-full text-left px-4 py-3.5 rounded-xl border
                transition-[border-color,background-color] duration-150 group
                ${PRIORITY_ROW[r.priority] ?? PRIORITY_ROW.medium}`}
            >
              <div className="flex items-start gap-3">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${STATUS_DOT[r.status] ?? "bg-[#B6B8C4]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[9px] font-mono text-[#EC9AA3]/75 tracking-wide">{r.reportNumber}</span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md
                      ${PRIORITY_PILL[r.priority] ?? PRIORITY_PILL.medium}`}>
                      {r.priority}
                    </span>
                    <span className={`text-[9px] font-semibold uppercase ${STATUS_TEXT[r.status] ?? "text-[#B6B8C4]"}`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-[#F8F8FA] truncate leading-snug">{r.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-[#B6B8C4]/65">{r.citizenName}</span>
                    <span className="text-[9px] text-[#B6B8C4]/30">·</span>
                    <span className="text-[9px] text-[#B6B8C4]/50 uppercase">{r.type}</span>
                  </div>
                </div>
                <span className="text-[8px] text-[#B6B8C4]/35 flex-shrink-0 whitespace-nowrap font-mono mt-0.5">
                  {rel(r.createdAt)}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {(detail || detailLoading) && (
          <motion.div className="fixed inset-0 z-50 flex justify-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={closeDetail} />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease }}
              className="relative w-full max-w-[520px] bg-[#0A0A11]
                border-l border-[rgba(236,154,163,0.08)] h-full overflow-y-auto"
              aria-label="Report detail"
            >
              <div className="p-6 space-y-5">
                {/* Drawer header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#F8F8FA]">Report Detail</h2>
                  <button onClick={closeDetail}
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

                {detail && (
                  <>
                    {/* Report meta */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-[#EC9AA3]/80">{detail.reportNumber}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md
                          ${PRIORITY_PILL[detail.priority] ?? PRIORITY_PILL.medium}`}>
                          {detail.priority}
                        </span>
                        <span className={`text-[9px] font-semibold uppercase ${STATUS_TEXT[detail.status] ?? "text-[#B6B8C4]"}`}>
                          {detail.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm text-[#F8F8FA] leading-relaxed">{detail.description}</p>
                    </div>

                    {/* AI Summary */}
                    {detail.aiSummary && (
                      <DS title="AI Analysis">
                        <div className="px-3 py-2.5 rounded-xl bg-[rgba(236,154,163,0.04)]
                          border border-[rgba(236,154,163,0.08)]">
                          <p className="text-[11px] text-[#B6B8C4] leading-relaxed">{detail.aiSummary}</p>
                        </div>
                      </DS>
                    )}

                    {/* Citizen */}
                    <DS title="Citizen Details">
                      <DR label="Name"     value={detail.citizenName} />
                      <DR label="Email"    value={detail.citizenEmail} />
                      {detail.citizenPhone    && <DR label="Phone"    value={detail.citizenPhone} />}
                      {detail.citizenLocation && <DR label="Location" value={detail.citizenLocation} />}
                    </DS>

                    {/* Scammer contact */}
                    {detail.scammerContact && Object.values(detail.scammerContact).some(Boolean) && (
                      <DS title="Scammer Contact">
                        {detail.scammerContact.phone   && <DR label="Phone"   value={detail.scammerContact.phone} />}
                        {detail.scammerContact.email   && <DR label="Email"   value={detail.scammerContact.email} />}
                        {detail.scammerContact.upiId   && <DR label="UPI ID" value={detail.scammerContact.upiId} />}
                        {detail.scammerContact.website && <DR label="Website" value={detail.scammerContact.website} />}
                      </DS>
                    )}

                    {/* Financial loss */}
                    {detail.financialLoss?.amount && (
                      <DS title="Financial Loss">
                        <DR label="Amount" value={`₹${detail.financialLoss.amount.toLocaleString("en-IN")}`} />
                      </DS>
                    )}

                    {/* Repeat offender profile */}
                    {detail.scammerProfile && (
                      <DS title="⚠ Repeat Offender Profile">
                        <DR label="Seen"     value={`${detail.scammerProfile.occurrences}× in system`} />
                        <DR label="Reports"  value={String(detail.scammerProfile.totalReports)} />
                        <DR label="Threat"   value={detail.scammerProfile.threatLevel.toUpperCase()} />
                        {detail.scammerProfile.phones.length > 0 && (
                          <DR label="Phones" value={detail.scammerProfile.phones.join(", ")} />
                        )}
                        {detail.scammerProfile.emails.length > 0 && (
                          <DR label="Emails" value={detail.scammerProfile.emails.join(", ")} />
                        )}
                        {detail.scammerProfile.upiIds.length > 0 && (
                          <DR label="UPIs"  value={detail.scammerProfile.upiIds.join(", ")} />
                        )}
                      </DS>
                    )}

                    {/* Extracted entities */}
                    {detail.extractedEntities?.length > 0 && (
                      <DS title="Extracted Entities">
                        <div className="flex flex-wrap gap-1.5">
                          {detail.extractedEntities.map((e, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg text-[9px] font-mono
                              bg-[rgba(236,154,163,0.07)] text-[#EC9AA3] border border-[rgba(236,154,163,0.1)]">
                              {e.type}: {e.value}
                            </span>
                          ))}
                        </div>
                      </DS>
                    )}

                    {/* Ack sent */}
                    {detail.acknowledgement && (
                      <DS title="Acknowledgement Sent">
                        <p className="text-[11px] text-emerald-400 font-medium">{detail.acknowledgement}</p>
                      </DS>
                    )}

                    {/* Internal notes */}
                    {detail.internalNotes?.length > 0 && (
                      <DS title={`Internal Notes (${detail.internalNotes.length})`}>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {detail.internalNotes.map((n, i) => (
                            <p key={i} className="text-[10px] text-[#B6B8C4]/70 font-mono leading-relaxed">{n}</p>
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
                            {STATUS_ACTIONS.map(s => (
                              <button key={s} onClick={() => handleStatus(s)}
                                disabled={actionLoading || detail.status === s.toLowerCase()}
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-semibold transition-all
                                  disabled:opacity-30
                                  ${detail.status === s.toLowerCase()
                                    ? "bg-[rgba(236,154,163,0.12)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]"
                                    : "bg-[#12121A] text-[#B6B8C4] border border-[rgba(236,154,163,0.07)]  hover:text-[#F8F8FA] hover:border-[rgba(236,154,163,0.2)]"
                                  }`}>
                                {s.replace(/_/g, " ")}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] text-[#B6B8C4]/45 uppercase tracking-wider mb-2">Send Acknowledgement</p>
                          <div className="flex gap-2">
                            <input value={ackMsg} onChange={e => setAckMsg(e.target.value)}
                              placeholder="Message to citizen…"
                              className="flex-1 px-3 py-2.5 rounded-xl text-xs bg-[#12121A]
                                border border-[rgba(236,154,163,0.08)] text-[#F8F8FA]
                                placeholder:text-[#B6B8C4]/30
                                focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors" />
                            <button onClick={handleAck} disabled={actionLoading || !ackMsg.trim()}
                              className="px-3.5 py-2.5 rounded-xl text-xs font-bold
                                bg-[#EC9AA3] text-[#050508] disabled:opacity-40
                                hover:bg-[#f3b3ba] transition-colors">
                              Send
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] text-[#B6B8C4]/45 uppercase tracking-wider mb-2">Internal Note</p>
                          <div className="flex gap-2">
                            <input value={noteText} onChange={e => setNoteText(e.target.value)}
                              placeholder="Add investigation note…"
                              className="flex-1 px-3 py-2.5 rounded-xl text-xs bg-[#12121A]
                                border border-[rgba(236,154,163,0.08)] text-[#F8F8FA]
                                placeholder:text-[#B6B8C4]/30
                                focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors" />
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

/* ─── Drawer sub-components ──────────────────────────────────────────── */
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
