"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScannerLayout } from "@/components/scanner";
import { AnalysisResultCard } from "@/components/scanner/AnalysisResultCard";
import { useQrScanPipeline } from "@/hooks/useQrScanPipeline";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

export default function QRScannerPage() {
  const {
    stage,
    file,
    decodedContent,
    contentType,
    confidence,
    parsedFields,
    report,
    error,
    handleUpload,
    handleAnalyze,
    handleRetry,
    reset,
    setContentType,
  } = useQrScanPipeline();

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            handleUpload(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleUpload]);

  // Drag over handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }
      handleUpload(droppedFile);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Stepper helper
  const getStepStatus = (stepName: string) => {
    if (stage === "error") return "error";
    
    const stagesOrder = ["uploading", "classifying", "confirming", "analyzing", "success"];
    const currentIdx = stagesOrder.indexOf(stage);
    
    let targetIdx = 0;
    if (stepName === "decode") targetIdx = 0;
    else if (stepName === "classify") targetIdx = 1;
    else if (stepName === "routing") targetIdx = 2;
    else if (stepName === "analyzing") targetIdx = 3;

    if (currentIdx > targetIdx) return "complete";
    if (currentIdx === targetIdx) return "active";
    return "pending";
  };

  // If scan is complete
  if (stage === "success" && report) {
    return (
      <ScannerLayout title="Scan QR Code" description="Analysis complete.">
        <div className="space-y-4">
          {/* QR details banner */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B6B8C4]/60 block mb-1">Decoded QR Content</span>
              <code className="font-mono text-[#EC9AA3] break-all">{report.decodedContent}</code>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#EC9AA3]/10 border border-[#EC9AA3]/20 text-[9px] font-bold uppercase tracking-wider text-[#EC9AA3]">
                {report.contentType}
              </span>
              <span className="text-[10px] text-[#B6B8C4]/40">
                Confidence: <strong className="text-[#F8F8FA]">{report.classificationConfidence}</strong>
              </span>
            </div>
          </div>
          
          <AnalysisResultCard result={report} onNewScan={reset} />
        </div>
      </ScannerLayout>
    );
  }

  return (
    <ScannerLayout 
      title="Scan QR Code" 
      description="Upload an image of a QR code or paste it from your clipboard to analyze its payload." 
      helpTips={[
        "QR codes can hide malicious redirect chains and spoofed banking templates.",
        "You can drag and drop or paste screenshots directly into this window.",
        "Opened links bypass browser-level safe browsing warnings.",
        "Verify credentials and network SSID details before connecting."
      ]}
    >
      <div className="space-y-6">
        
        {/* Upload Zone */}
        {stage === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              dragActive 
                ? "border-[#EC9AA3] bg-[#EC9AA3]/5 scale-[1.01] shadow-[0_0_20px_rgba(236,154,163,0.1)]" 
                : "border-[rgba(255,255,255,0.08)] bg-white/5 hover:border-[rgba(236,154,163,0.2)] hover:bg-[#EC9AA3]/2"
            }`}
            onClick={triggerFileSelect}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/jpg, image/webp" 
              onChange={onFileChange} 
            />
            <div className="space-y-4">
              <span className="text-4xl block">📷</span>
              <h3 className="text-sm font-bold text-[#F8F8FA]">Drag & Drop QR Image</h3>
              <p className="text-[11px] text-[#B6B8C4]/60">
                Or click to browse · Paste from clipboard (Ctrl+V / ⌘+V)
              </p>
              <p className="text-[9px] text-[#B6B8C4]/40">
                Supports PNG, JPEG, JPG, WEBP up to 5MB
              </p>
            </div>
          </motion.div>
        )}

        {/* Pipeline Stepper */}
        {["uploading", "classifying", "analyzing"].includes(stage) && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#B6B8C4]/60">Scanning Pipeline</h3>
            <div className="space-y-3">
              {[
                { name: "decode", label: "Decoding QR Matrix..." },
                { name: "classify", label: "Classifying Payload Type..." },
                { name: "routing", label: "Routing to Threat Engine..." },
                { name: "analyzing", label: "Fusing Intelligence & Scoring..." }
              ].map((step, idx) => {
                const status = getStepStatus(step.name);
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs select-none">
                    {status === "complete" ? (
                      <span className="text-emerald-400 font-bold select-none text-xs">✓</span>
                    ) : status === "active" ? (
                      <span className="w-2 h-2 rounded-full bg-[#EC9AA3] animate-ping" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    )}
                    <span className={status === "active" ? "text-[#F8F8FA] font-medium" : "text-[#B6B8C4]/40"}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error State */}
        {stage === "error" && (
          <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-4 text-center">
            <span className="text-3xl block">⚠️</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Scan Pipeline Error</h3>
            <p className="text-xs text-[#B6B8C4]">{error}</p>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                onClick={handleRetry} 
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all"
              >
                Retry Stage
              </button>
              <button 
                onClick={reset} 
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#B6B8C4] text-xs font-medium border border-white/5 transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Preview */}
        {stage === "confirming" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#B6B8C4]/60">QR Preview</h3>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {file && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-white/5 relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt="Uploaded QR code" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 space-y-2 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B6B8C4]/60 block">Payload</span>
                <pre className="p-3 rounded-lg bg-black/40 text-[10px] font-mono text-[#EC9AA3] break-all max-h-20 overflow-y-auto whitespace-pre-wrap select-text">
                  {decodedContent}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="manual-type" className="block text-[10px] font-bold uppercase tracking-widest text-[#B6B8C4]/60 mb-1.5">Detected Type</label>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#EC9AA3]/10 border border-[#EC9AA3]/20 text-[10px] font-bold uppercase tracking-wider text-[#EC9AA3]">
                    {contentType}
                  </span>
                  <span className="text-[9px] text-[#B6B8C4]/40">
                    {confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>
              </div>
              <div>
                <label htmlFor="type-override" className="block text-[10px] font-bold uppercase tracking-widest text-[#B6B8C4]/60 mb-1.5">Override Type (Optional)</label>
                <select 
                  id="type-override" 
                  value={contentType.toLowerCase()} 
                  onChange={(e) => setContentType(e.target.value.toUpperCase())} 
                  className="w-full px-3 py-1.5 rounded-lg text-xs text-[#F8F8FA] bg-[#12121A] border border-[rgba(236,154,163,0.12)] focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-all duration-200"
                >
                  <option value="url">URL</option>
                  <option value="upi">UPI ID</option>
                  <option value="phone">Phone</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="wifi">WiFi Config</option>
                  <option value="deep_link">Deep Link</option>
                  <option value="plain_text">Plain Text</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleAnalyze} 
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA] text-[#050508] font-bold text-xs hover:shadow-[0_4px_16px_rgba(236,154,163,0.3)] active:scale-[0.98] transition-all"
              >
                Analyze Content
              </button>
              <button 
                onClick={reset} 
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#B6B8C4] border border-white/5 text-xs font-medium transition-all"
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </ScannerLayout>
  );
}
