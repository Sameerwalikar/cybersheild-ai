"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ScannerLayout } from "@/components/scanner";
import { AnalysisResultCard } from "@/components/scanner/AnalysisResultCard";
import { useQrScanPipeline, SCAN_STEPS } from "@/hooks/useQrScanPipeline";

export default function QRScannerPage() {
  const {
    stage,
    file,
    activeStepIndex,
    report,
    error,
    handleUpload,
    handleRetry,
    reset,
  } = useQrScanPipeline();

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = stage === "loading";

  // Clipboard paste handler
  useEffect(() => {
    if (isLoading) return; // Disable during loading

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
  }, [handleUpload, isLoading]);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isLoading) return;
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
    if (isLoading) return;
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const getStepStatus = (index: number) => {
    if (stage === "error") return "error";
    if (activeStepIndex > index) return "complete";
    if (activeStepIndex === index) return "active";
    return "pending";
  };

  // If scan is complete
  if (stage === "success" && report) {
    return (
      <ScannerLayout title="Scan QR Code" description="Analysis complete.">
        <div className="space-y-4">
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
        {stage !== "loading" && stage !== "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EC9AA3] ${
              dragActive 
                ? "border-[#EC9AA3] bg-[#EC9AA3]/5 scale-[1.01] shadow-[0_0_20px_rgba(236,154,163,0.1)]" 
                : "border-[rgba(255,255,255,0.08)] bg-white/5 hover:border-[rgba(236,154,163,0.2)] hover:bg-[#EC9AA3]/2"
            }`}
            onClick={triggerFileSelect}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                triggerFileSelect();
              }
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
            aria-label="Upload QR Image. Drag and drop, browse, or paste image from clipboard."
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/jpg, image/webp" 
              onChange={onFileChange} 
            />
            <div className="space-y-4">
              <span className="text-4xl block" role="img" aria-label="camera">📷</span>
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

        {/* Loading / Pipeline Progress Stepper */}
        {isLoading && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4" role="status" aria-live="polite">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#B6B8C4]/60">SecOps Scan Pipeline</h3>
              <span className="text-[10px] text-[#B6B8C4]/40 font-mono">
                Step {activeStepIndex + 1} of {SCAN_STEPS.length}
              </span>
            </div>
            <div className="space-y-3">
              {SCAN_STEPS.map((stepLabel, idx) => {
                const status = getStepStatus(idx);
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs select-none">
                    {status === "complete" ? (
                      <span className="text-emerald-400 font-bold text-xs" aria-label="Completed">✓</span>
                    ) : status === "active" ? (
                      <span className="w-2 h-2 rounded-full bg-[#EC9AA3] animate-ping" aria-label="In Progress" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/10" aria-label="Pending" />
                    )}
                    <span className={status === "active" ? "text-[#F8F8FA] font-medium" : "text-[#B6B8C4]/40"}>
                      {stepLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error State */}
        {stage === "error" && (
          <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-4 text-center" role="alert">
            <span className="text-3xl block" role="img" aria-label="warning">⚠️</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Scan Pipeline Error</h3>
            <p className="text-xs text-[#B6B8C4]">{error}</p>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                onClick={handleRetry} 
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all focus:ring-2 focus:ring-red-400 focus:outline-none"
              >
                Retry Scan
              </button>
              <button 
                onClick={reset} 
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#B6B8C4] text-xs font-medium border border-white/5 transition-all focus:ring-2 focus:ring-white/40 focus:outline-none"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </ScannerLayout>
  );
}
