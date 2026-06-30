"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { evidenceApi, type EvidenceItem } from "@/services/api/evidence";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;
const riskBg: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };

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

  const loadItems = useCallback(async () => {
    try {
      const data = await evidenceApi.list();
      setItems(data.items);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

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
      const data = await evidenceApi.upload(selectedFile.name, selectedFile.type, base64);
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

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Evidence Intelligence</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Upload screenshots, fake receipts, or scam documents for AI analysis.</p>
      </motion.div>

      {/* Upload zone */}
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
                    <p className="text-[9px] text-[#B6B8C4]">{item.mimeType} • {new Date(item.createdAt).toLocaleDateString("en-IN")}</p>
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
