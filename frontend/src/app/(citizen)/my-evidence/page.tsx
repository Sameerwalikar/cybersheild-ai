"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { evidenceApi, type EvidenceItem } from "@/services/api/evidence";
import { reportsApi, type ReportItem } from "@/services/api/reports";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace("/api/v1", "");
const MAX_SIZE = 10 * 1024 * 1024;
const riskBg: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };


const categoryLabels: Record<string, string> = {
  Phishing: "Phishing",
  "Financial Fraud": "Financial Fraud",
  "Identity Theft": "Identity Theft",
  "Vishing (Voice Scam)": "Vishing",
  "UPI Fraud": "UPI Fraud",
  Other: "Other",
};

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  submitted: { bg: "bg-blue-400", color: "text-blue-400", label: "Submitted" },
  under_review: { bg: "bg-amber-400", color: "text-amber-400", label: "Under Review" },
  investigating: { bg: "bg-[#EC9AA3]", color: "text-[#EC9AA3]", label: "Investigating" },
  action_taken: { bg: "bg-emerald-400", color: "text-emerald-400", label: "Action Taken" },
  resolved: { bg: "bg-emerald-300", color: "text-emerald-300", label: "Resolved" },
  rejected: { bg: "bg-red-400", color: "text-red-400/60", label: "Rejected" },
};

export default function EvidencePage() {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<EvidenceItem | null>(null);
  const [detail, setDetail] = useState<EvidenceItem | null>(null);

  // Complaint selection state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [complaintStepDone, setComplaintStepDone] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const data = await evidenceApi.list();
      setItems(data.items);
    } catch {}
    setLoading(false);
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const data = await reportsApi.list();
      setReports(data.items);
    } catch {}
    setReportsLoading(false);
  }, []);

  useEffect(() => { loadItems(); loadReports(); }, [loadItems, loadReports]);

  const handleFile = (file: File) => {
    setUploadError(null);
    setResult(null);
    if (!ALLOWED.includes(file.type)) { setUploadError("Unsupported file. Allowed: PNG, JPG, WEBP, PDF"); return; }
    if (file.size > MAX_SIZE) { setUploadError("File exceeds 10MB limit."); return; }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Remove data:...;base64, prefix
        };
        reader.readAsDataURL(selectedFile);
      });
      const data = await evidenceApi.upload(selectedFile.name, selectedFile.type, base64, selectedReport?.id);
      setResult(data);
      setSelectedFile(null);
      setPreview(null);
      loadItems();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await evidenceApi.remove(id);
      setItems((prev) => prev.filter((e) => e.id !== id));
      if (detail?.id === id) setDetail(null);
    } catch {}
  };

  const handleSelectReport = (report: ReportItem) => {
    setSelectedReport(report);
    setComplaintStepDone(true);
  };

  const handleSkipComplaint = () => {
    setSelectedReport(null);
    setComplaintStepDone(true);
  };

  const handleChangeComplaint = () => {
    setComplaintStepDone(false);
    setSelectedReport(null);
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Evidence Intelligence</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Upload screenshots, fake receipts, or scam documents for AI analysis.</p>
      </motion.div>

      {/* Step 1: Select a Complaint */}
      {!complaintStepDone ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#F8F8FA] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#EC9AA3] text-[#050508] flex items-center justify-center text-xs font-bold">1</span>
                Select a Complaint
              </h2>
              <p className="mt-1 text-xs text-[#B6B8C4] ml-8">Choose a complaint to attach evidence to, or skip to upload without linking.</p>
            </div>
            <button
              onClick={handleSkipComplaint}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#B6B8C4] border border-[rgba(236,154,163,0.12)] hover:text-[#F8F8FA] hover:border-[rgba(236,154,163,0.25)] transition-all duration-200"
            >
              Skip — Upload without linking
            </button>
          </div>

          {reportsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#12121A] border border-[rgba(236,154,163,0.08)] flex items-center justify-center mb-3 text-[#EC9AA3]/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              </div>
              <p className="text-sm font-semibold text-[#F8F8FA]">No complaints found</p>
              <p className="text-xs text-[#B6B8C4] mt-1">You haven&apos;t filed any reports yet. You can still upload evidence.</p>
              <button
                onClick={handleSkipComplaint}
                className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] hover:shadow-[0_4px_12px_rgba(236,154,163,0.2)] transition-shadow"
              >
                Continue without linking
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {reports.map((report) => {
                const style = statusStyles[report.status] || { bg: "bg-[#B6B8C4]", color: "text-[#B6B8C4]", label: report.status };
                const date = new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                return (
                  <button
                    key={report.id}
                    onClick={() => handleSelectReport(report)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between p-4 rounded-xl border border-[rgba(236,154,163,0.06)] bg-[#0D0D12]/80 hover:border-[rgba(236,154,163,0.2)] hover:bg-[#0D0D12] transition-all duration-200 group-hover:shadow-[0_2px_12px_rgba(236,154,163,0.04)]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono text-[#EC9AA3]">{report.reportNumber}</span>
                          <span className="text-[10px] font-bold text-[#B6B8C4] uppercase">{categoryLabels[report.type] || report.type}</span>
                        </div>
                        <p className="text-xs text-[#F8F8FA] line-clamp-1">{report.description}</p>
                        <p className="text-[9px] text-[#B6B8C4]/60 mt-1">{date}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                          report.status === "resolved" || report.status === "action_taken" ? "border-emerald-500/20 bg-emerald-500/5" :
                          report.status === "rejected" ? "border-red-500/20 bg-red-500/5" :
                          "border-[rgba(236,154,163,0.1)] bg-[#12121A]"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} />
                          <span className={`text-[9px] font-semibold ${style.color}`}>{style.label}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#B6B8C4]/30 group-hover:text-[#EC9AA3] transition-colors">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      ) : (
        <>
          {/* Selected complaint badge */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.1)]"
          >
            <span className="w-6 h-6 rounded-full bg-[#EC9AA3]/10 text-[#EC9AA3] flex items-center justify-center text-[10px] font-bold">✓</span>
            {selectedReport ? (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#F8F8FA]">
                  Linking to <span className="font-mono text-[#EC9AA3]">{selectedReport.reportNumber}</span>
                  <span className="text-[#B6B8C4] ml-2">•</span>
                  <span className="text-[#B6B8C4] ml-2 text-[10px]">{categoryLabels[selectedReport.type] || selectedReport.type}</span>
                </p>
                <p className="text-[9px] text-[#B6B8C4] line-clamp-1 mt-0.5">{selectedReport.description}</p>
              </div>
            ) : (
              <p className="text-xs text-[#B6B8C4] flex-1">Uploading without linking to a complaint</p>
            )}
            <button
              onClick={handleChangeComplaint}
              className="px-3 py-1.5 rounded-lg text-[10px] font-medium text-[#EC9AA3] border border-[rgba(236,154,163,0.15)] hover:bg-[rgba(236,154,163,0.04)] transition-colors"
            >
              Change
            </button>
          </motion.div>

          {/* Step 2: Upload zone */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#EC9AA3] text-[#050508] flex items-center justify-center text-xs font-bold">2</span>
              <h2 className="text-sm font-semibold text-[#F8F8FA]">Upload Evidence</h2>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver ? "border-[#EC9AA3] bg-[rgba(236,154,163,0.04)]" : "border-[rgba(236,154,163,0.12)] hover:border-[rgba(236,154,163,0.25)]"}`}
            >
              {preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Preview" className="max-w-[200px] max-h-[200px] mx-auto rounded-lg border border-[rgba(236,154,163,0.1)]" />
                  <p className="text-xs text-[#B6B8C4]">{selectedFile?.name} ({(selectedFile?.size || 0 / 1024 / 1024).toFixed(1)} bytes)</p>
                  <div className="flex justify-center gap-3">
                    <button onClick={handleUpload} disabled={uploading} className="px-5 py-2 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] disabled:opacity-50 hover:shadow-[0_4px_12px_rgba(236,154,163,0.2)] active:scale-[0.97] transition-all flex items-center gap-2">
                      {uploading && <span className="w-3 h-3 border-2 border-[#050508] border-t-transparent rounded-full animate-spin" />}
                      {uploading ? "Analyzing..." : "Analyze Evidence"}
                    </button>
                    <button onClick={() => { setSelectedFile(null); setPreview(null); }} className="px-4 py-2 rounded-xl text-xs text-[#B6B8C4] border border-[rgba(236,154,163,0.1)] hover:text-[#F8F8FA] transition-colors">Cancel</button>
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#12121A] border border-[rgba(236,154,163,0.1)] flex items-center justify-center mx-auto text-[#EC9AA3]">📄</div>
                  <p className="text-xs text-[#F8F8FA]">{selectedFile.name}</p>
                  <div className="flex justify-center gap-3">
                    <button onClick={handleUpload} disabled={uploading} className="px-5 py-2 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] disabled:opacity-50 transition-all flex items-center gap-2">
                      {uploading && <span className="w-3 h-3 border-2 border-[#050508] border-t-transparent rounded-full animate-spin" />}
                      {uploading ? "Analyzing..." : "Analyze Evidence"}
                    </button>
                    <button onClick={() => setSelectedFile(null)} className="px-4 py-2 rounded-xl text-xs text-[#B6B8C4] border border-[rgba(236,154,163,0.1)]">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#12121A] border border-[rgba(236,154,163,0.1)] flex items-center justify-center mx-auto text-[#EC9AA3]/50">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  </div>
                  <p className="text-sm text-[#B6B8C4]">Drag & drop evidence here</p>
                  <p className="text-[10px] text-[#B6B8C4]/50">PNG, JPG, WEBP, PDF — Max 10MB</p>
                  <label className="inline-block px-4 py-2 rounded-lg text-xs font-medium text-[#EC9AA3] border border-[rgba(236,154,163,0.2)] hover:bg-[rgba(236,154,163,0.04)] cursor-pointer">
                    Browse Files
                    <input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </label>
                </div>
              )}
              {uploadError && <p className="text-xs text-red-400 mt-3">{uploadError}</p>}
            </div>
          </motion.div>

          {/* Analysis Result */}
          {result && (
            <motion.div className="rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] p-5 space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase">Analysis Result {result.cached && "(Cached)"}</h3>
                <div className={`w-3 h-3 rounded-full ${riskBg[result.riskLevel] || "bg-[#B6B8C4]"}`} />
              </div>
              <p className="text-lg font-bold text-[#F8F8FA] tabular-nums">{result.riskScore}<span className="text-sm text-[#B6B8C4]">/100</span></p>
              <p className="text-xs text-[#B6B8C4] leading-relaxed">{result.visionSummary}</p>
              {Array.isArray(result.detectedEntities) && result.detectedEntities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.detectedEntities.map((e, i) => <span key={i} className="px-2 py-0.5 rounded text-[9px] text-[#B6B8C4] bg-[#12121A] border border-[rgba(236,154,163,0.06)]">{e}</span>)}
                </div>
              )}
            </motion.div>
          )}
        </>
      )}

      {/* History */}
      <div>
        <h2 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Uploaded Evidence</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({length:3}).map((_,i) => <div key={i} className="h-14 rounded-lg bg-[rgba(236,154,163,0.03)] animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-xs text-[#B6B8C4]/60 py-8 text-center">No evidence uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] hover:border-[rgba(236,154,163,0.12)] transition-colors">
                <button onClick={() => setDetail(item)} className="flex items-center gap-3 min-w-0 text-left">
                  <div className={`w-2.5 h-2.5 rounded-full ${riskBg[item.riskLevel] || "bg-[#B6B8C4]"}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-[#F8F8FA] truncate">{item.filename}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[9px] text-[#B6B8C4]">{item.mimeType} • {new Date(item.createdAt).toLocaleDateString("en-IN")}</p>
                      {item.reportNumber && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[rgba(236,154,163,0.06)] border border-[rgba(236,154,163,0.08)]">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#EC9AA3]/60"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          <span className="text-[8px] font-mono text-[#EC9AA3]/70">{item.reportNumber}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-[#F8F8FA] tabular-nums">{item.riskScore}</span>
                  <button onClick={() => handleDelete(item.id)} className="w-6 h-6 rounded flex items-center justify-center text-[#B6B8C4]/40 hover:text-red-400 transition-colors text-xs">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detail && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setDetail(null)} />
            <motion.div className="relative w-full max-w-md bg-[#0D0D12] border border-[rgba(236,154,163,0.1)] rounded-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <button onClick={() => setDetail(null)} className="absolute top-4 right-4 text-[#B6B8C4] hover:text-[#F8F8FA]">✕</button>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${riskBg[detail.riskLevel]}`} />
                <span className="text-sm font-bold text-[#F8F8FA] capitalize">{detail.riskLevel} Risk</span>
              </div>
              <p className="text-2xl font-bold text-[#F8F8FA] tabular-nums">{detail.riskScore}/100</p>
              <div className="space-y-2">
                <p className="text-[10px] text-[#B6B8C4] uppercase font-bold">File</p>
                <p className="text-xs text-[#F8F8FA]">{detail.filename}</p>
                <p className="text-[9px] text-[#B6B8C4]">{detail.mimeType} • {detail.fileSize} bytes</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-[#B6B8C4] uppercase font-bold">File Content</p>
                {detail.storagePath ? (
                  <div className="rounded-xl overflow-hidden border border-[rgba(236,154,163,0.1)] bg-[#12121A]">
                    {detail.mimeType.startsWith("image/") ? (
                      <div className="relative group">
                        <img 
                          src={`${BASE_URL}${detail.storagePath}`} 
                          alt={detail.filename} 
                          className="w-full max-h-[220px] object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a 
                            href={`${BASE_URL}${detail.storagePath}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-3.5 py-1.5 bg-[#EC9AA3] text-[#050508] font-bold text-xs rounded-xl shadow-lg hover:bg-[#ffb0b9] transition-colors"
                          >
                            Open in New Tab
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 flex flex-col items-center justify-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#EC9AA3]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <div className="text-center mb-1">
                          <p className="text-[10px] text-[#B6B8C4] font-medium max-w-[180px] truncate">{detail.filename}</p>
                        </div>
                        <a 
                          href={`${BASE_URL}${detail.storagePath}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-[rgba(236,154,163,0.1)] hover:bg-[rgba(236,154,163,0.15)] text-[#EC9AA3] font-bold text-xs rounded-xl border border-[rgba(236,154,163,0.2)] transition-all flex items-center gap-1"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          View / Download PDF
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(236,154,163,0.02)] border border-dashed border-[rgba(236,154,163,0.08)]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#B6B8C4]/35"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                    <p className="text-[9px] text-[#B6B8C4]/35 italic">File content not available for legacy upload</p>
                  </div>
                )}
              </div>
              {detail.reportNumber && (
                <div className="px-3 py-2 rounded-lg bg-[rgba(236,154,163,0.04)] border border-[rgba(236,154,163,0.08)]">
                  <p className="text-[10px] text-[#B6B8C4] uppercase font-bold mb-0.5">Linked Complaint</p>
                  <p className="text-xs text-[#F8F8FA]">
                    <span className="font-mono text-[#EC9AA3]">{detail.reportNumber}</span>
                    {detail.reportType && <span className="text-[#B6B8C4] ml-2">• {categoryLabels[detail.reportType] || detail.reportType}</span>}
                  </p>
                </div>
              )}
              {detail.visionSummary && (
                <div>
                  <p className="text-[10px] text-[#B6B8C4] uppercase font-bold mb-1">AI Analysis</p>
                  <p className="text-xs text-[#B6B8C4] leading-relaxed">{detail.visionSummary}</p>
                </div>
              )}
              {Array.isArray(detail.detectedEntities) && detail.detectedEntities.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#B6B8C4] uppercase font-bold mb-1">Detected Entities</p>
                  <div className="flex flex-wrap gap-1.5">{detail.detectedEntities.map((e, i) => <span key={i} className="px-2 py-0.5 rounded text-[9px] text-[#F8F8FA] bg-[#12121A] border border-[rgba(236,154,163,0.08)]">{e}</span>)}</div>
                </div>
              )}
              <p className="text-[9px] text-[#B6B8C4]/50">Confidence: {Math.round((detail.confidence || 0) * 100)}% • {new Date(detail.createdAt).toLocaleString("en-IN")}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
