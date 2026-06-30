"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { policeApi, type PoliceReportItem, type PoliceReportDetail } from "@/services/api/police";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const statusFilters = ["all", "SUBMITTED", "UNDER_REVIEW", "INVESTIGATING", "ACTION_TAKEN", "RESOLVED", "REJECTED", "ARCHIVED"];
const priorityFilters = ["all", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const statusColor: Record<string, string> = { submitted: "text-blue-400", under_review: "text-amber-400", investigating: "text-[#EC9AA3]", action_taken: "text-emerald-400", resolved: "text-emerald-300", rejected: "text-red-400/60", archived: "text-[#B6B8C4]/50" };
const priorityBadge: Record<string, string> = { critical: "bg-red-500 text-white", high: "bg-orange-500/80 text-white", medium: "bg-amber-500/80 text-[#050508]", low: "bg-[#B6B8C4]/20 text-[#B6B8C4]" };

export default function PoliceReportsPage() {
  const [reports, setReports] = useState<PoliceReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PoliceReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [ackMessage, setAckMessage] = useState("");
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    setLoading(true);
    policeApi.getReports({
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
    })
      .then((data) => setReports(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const d = await policeApi.getReport(id);
      setDetail(d);
    } catch (err: any) { setError(err.message); }
    setDetailLoading(false);
  };

  const closeDetail = () => { setSelectedId(null); setDetail(null); setAckMessage(""); setNoteText(""); };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await policeApi.updateReportStatus(selectedId, newStatus);
      setDetail((d) => d ? { ...d, status: newStatus.toLowerCase() } : d);
      setReports((prev) => prev.map((r) => r.id === selectedId ? { ...r, status: newStatus.toLowerCase() } : r));
    } catch {}
    setActionLoading(false);
  };

  const handleAcknowledge = async () => {
    if (!selectedId || !ackMessage.trim()) return;
    setActionLoading(true);
    try {
      await policeApi.acknowledgeReport(selectedId, ackMessage);
      setDetail((d) => d ? { ...d, acknowledgement: ackMessage } : d);
      setAckMessage("");
    } catch {}
    setActionLoading(false);
  };

  const handleAddNote = async () => {
    if (!selectedId || !noteText.trim()) return;
    setActionLoading(true);
    try {
      await policeApi.addReportNote(selectedId, noteText);
      const ts = new Date().toISOString();
      setDetail((d) => d ? { ...d, internalNotes: [...d.internalNotes, `[${ts}] ${noteText}`] } : d);
      setNoteText("");
    } catch {}
    setActionLoading(false);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Citizen Reports</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Manage and investigate submitted reports.</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] text-[#B6B8C4] uppercase">Status:</span>
        {statusFilters.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 rounded-md text-[10px] font-medium capitalize transition-all ${statusFilter === s ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]" : "text-[#B6B8C4] hover:text-[#F8F8FA]"}`}>
            {s === "all" ? "All" : s.toLowerCase().replace(/_/g, " ")}
          </button>
        ))}
        <span className="text-[9px] text-[#B6B8C4] uppercase ml-4">Priority:</span>
        {priorityFilters.map((p) => (
          <button key={p} onClick={() => setPriorityFilter(p)} className={`px-2.5 py-1 rounded-md text-[10px] font-medium capitalize transition-all ${priorityFilter === p ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]" : "text-[#B6B8C4] hover:text-[#F8F8FA]"}`}>
            {p === "all" ? "All" : p.toLowerCase()}
          </button>
        ))}
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
      {loading && <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-16 rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse" />)}</div>}

      {!loading && reports.length === 0 && <p className="text-sm text-[#B6B8C4] text-center py-12">No reports match the filters.</p>}
      {!loading && reports.length > 0 && (
        <div className="space-y-2">
          {reports.map((r) => (
            <button key={r.id} onClick={() => openDetail(r.id)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-[rgba(236,154,163,0.2)] ${r.priority === "critical" ? "bg-red-500/5 border-red-500/15" : r.priority === "high" ? "bg-orange-500/3 border-orange-500/10" : "bg-[#0D0D12]/80 border-[rgba(236,154,163,0.06)]"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-[#EC9AA3]">{r.reportNumber}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${priorityBadge[r.priority]}`}>{r.priority}</span>
                  <span className={`text-[9px] font-bold uppercase ${statusColor[r.status]}`}>{r.status.replace(/_/g, " ")}</span>
                </div>
                <span className="text-[8px] text-[#B6B8C4]/50">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
              </div>
              <p className="text-xs text-[#F8F8FA] mt-1 truncate">{r.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px] text-[#B6B8C4]">{r.citizenName}</span>
                <span className="text-[9px] text-[#B6B8C4]/60">{r.type}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={closeDetail} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease }} className="relative w-full max-w-lg bg-[#0D0D12] border-l border-[rgba(236,154,163,0.1)] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#F8F8FA]">Report Detail</h2>
                <button onClick={closeDetail} className="text-[#B6B8C4] hover:text-[#F8F8FA] text-lg">×</button>
              </div>

              {detailLoading && <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-[rgba(236,154,163,0.03)] animate-pulse" />)}</div>}

              {detail && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#EC9AA3]">{detail.reportNumber}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${priorityBadge[detail.priority]}`}>{detail.priority}</span>
                    </div>
                    <p className="text-xs text-[#F8F8FA]">{detail.description}</p>
                  </div>

                  <DSection title="Citizen Details">
                    <DRow label="Name" value={detail.citizenName} />
                    <DRow label="Email" value={detail.citizenEmail} />
                    {detail.citizenPhone && <DRow label="Phone" value={detail.citizenPhone} />}
                    {detail.citizenLocation && <DRow label="Location" value={detail.citizenLocation} />}
                  </DSection>

                  {detail.scammerContact && Object.values(detail.scammerContact).some(Boolean) && (
                    <DSection title="Scammer Information">
                      {detail.scammerContact.phone && <DRow label="Phone" value={detail.scammerContact.phone} />}
                      {detail.scammerContact.email && <DRow label="Email" value={detail.scammerContact.email} />}
                      {detail.scammerContact.upiId && <DRow label="UPI" value={detail.scammerContact.upiId} />}
                      {detail.scammerContact.website && <DRow label="Website" value={detail.scammerContact.website} />}
                    </DSection>
                  )}

                  {detail.financialLoss?.amount && (
                    <DSection title="Financial Loss">
                      <DRow label="Amount" value={`₹${detail.financialLoss.amount.toLocaleString()}`} />
                    </DSection>
                  )}

                  {detail.scammerProfile && (
                    <DSection title="🔁 Scammer Profile (Repeat Offender)">
                      <DRow label="Occurrences" value={`${detail.scammerProfile.occurrences}×`} />
                      <DRow label="Reports" value={String(detail.scammerProfile.totalReports)} />
                      <DRow label="Threat" value={detail.scammerProfile.threatLevel} />
                      {detail.scammerProfile.phones.length > 0 && <DRow label="Phones" value={detail.scammerProfile.phones.join(", ")} />}
                      {detail.scammerProfile.emails.length > 0 && <DRow label="Emails" value={detail.scammerProfile.emails.join(", ")} />}
                      {detail.scammerProfile.upiIds.length > 0 && <DRow label="UPIs" value={detail.scammerProfile.upiIds.join(", ")} />}
                    </DSection>
                  )}

                  {detail.extractedEntities?.length > 0 && (
                    <DSection title="Extracted Entities">
                      <div className="flex flex-wrap gap-1.5">
                        {detail.extractedEntities.map((e, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[9px] bg-[rgba(236,154,163,0.06)] text-[#EC9AA3] font-mono">{e.type}: {e.value}</span>
                        ))}
                      </div>
                    </DSection>
                  )}

                  {detail.aiSummary && (
                    <DSection title="AI Summary">
                      <p className="text-[11px] text-[#B6B8C4] leading-relaxed">{detail.aiSummary}</p>
                    </DSection>
                  )}

                  {detail.acknowledgement && (
                    <DSection title="Acknowledgement Sent">
                      <p className="text-[11px] text-emerald-400">{detail.acknowledgement}</p>
                    </DSection>
                  )}

                  {detail.internalNotes?.length > 0 && (
                    <DSection title="Internal Notes">
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {detail.internalNotes.map((n, i) => (<p key={i} className="text-[10px] text-[#B6B8C4] font-mono">{n}</p>))}
                      </div>
                    </DSection>
                  )}

                  <DSection title="Actions">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Status</label>
                        <div className="flex flex-wrap gap-1.5">
                          {["UNDER_REVIEW", "INVESTIGATING", "ACTION_TAKEN", "RESOLVED", "REJECTED"].map((s) => (
                            <button key={s} onClick={() => handleStatusChange(s)} disabled={actionLoading || detail.status === s.toLowerCase()} className={`px-2 py-1 rounded text-[9px] font-medium transition-all disabled:opacity-30 ${detail.status === s.toLowerCase() ? "bg-[#EC9AA3]/20 text-[#EC9AA3]" : "bg-[#12121A] text-[#B6B8C4] hover:text-[#F8F8FA] border border-[rgba(236,154,163,0.08)]"}`}>
                              {s.replace(/_/g, " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Acknowledge</label>
                        <div className="flex gap-2">
                          <input type="text" value={ackMessage} onChange={(e) => setAckMessage(e.target.value)} placeholder="Message to citizen..." className="flex-1 px-3 py-2 rounded-lg text-[11px] bg-[#12121A] border border-[rgba(236,154,163,0.08)] text-[#F8F8FA] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)]" />
                          <button onClick={handleAcknowledge} disabled={actionLoading || !ackMessage.trim()} className="px-3 py-2 rounded-lg text-[10px] font-medium bg-[#EC9AA3] text-[#050508] disabled:opacity-40">Send</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-[#B6B8C4] uppercase mb-1 block">Internal Note</label>
                        <div className="flex gap-2">
                          <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add note..." className="flex-1 px-3 py-2 rounded-lg text-[11px] bg-[#12121A] border border-[rgba(236,154,163,0.08)] text-[#F8F8FA] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)]" />
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

function DSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[9px] font-bold text-[#B6B8C4] uppercase tracking-wider">{title}</h3>
      <div className="rounded-lg bg-[#12121A]/50 border border-[rgba(236,154,163,0.04)] p-3 space-y-1.5">{children}</div>
    </div>
  );
}

function DRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[10px] text-[#B6B8C4] flex-shrink-0">{label}</span>
      <span className="text-[10px] text-[#F8F8FA] text-right break-all">{value}</span>
    </div>
  );
}
