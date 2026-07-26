"use client";

import { useState, useRef, useEffect } from "react";
import { ScannerLayout, ScanButton } from "@/components/scanner";
import { type ScanResult } from "@/services/api/scanner";
import { AnalysisResultCard } from "@/components/scanner/AnalysisResultCard";
import { UploadCloud, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const loadingMessages = [
  "Uploading screenshot...",
  "Analyzing visual elements...",
  "Extracting bio and text...",
  "Checking for fake badges...",
  "Running impersonation heuristics...",
  "Finalizing risk score..."
];

export default function SocialMediaScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File | undefined | null) => {
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
      setResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          handleFile(blob);
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      setLoadingMsgIdx(0);
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/analyze/social-media/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Failed to analyze image");

      setResult(json.data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsScanning(false);
    }
  };

  if (result) {
    return (
      <ScannerLayout title="Social Media Scan" description="Analysis complete.">
        <AnalysisResultCard result={result} />
        <button
          onClick={handleRemove}
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.1)] text-[#B6B8C4] hover:text-white hover:bg-[#12121A] transition-all text-sm font-semibold mx-auto block"
        >
          Scan Another Profile
        </button>
      </ScannerLayout>
    );
  }

  return (
    <ScannerLayout 
      title="Social Media Impersonation" 
      description="Upload a screenshot of a suspicious WhatsApp, Instagram, Facebook or LinkedIn profile to detect fake officers and impersonators." 
      helpTips={[
        "Ensure the profile picture and bio are clearly visible.",
        "Scammers often use low-resolution, stolen photos.",
        "Watch out for misspellings like 'Customs Offcer' or 'CBI Headquater'.",
        "Never send money or crypto to unverified online profiles."
      ]}
    >
      <div className="space-y-6">
        <div 
          className={`relative w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
            preview 
              ? "border-[rgba(236,154,163,0.3)] bg-[#12121A]/30 overflow-hidden p-2" 
              : "border-[rgba(236,154,163,0.15)] bg-[#0D0D12]/50 hover:bg-[#12121A]/50 hover:border-[rgba(236,154,163,0.25)] cursor-pointer"
          }`}
          onClick={() => !preview && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full flex items-center justify-center group"
              >
                <img 
                  src={preview} 
                  alt="Profile preview" 
                  className={`max-w-full max-h-full object-contain rounded-xl shadow-lg transition-all ${isScanning ? 'blur-sm opacity-50' : ''}`} 
                />
                
                {isScanning ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 rounded-xl backdrop-blur-sm">
                    <Loader2 className="animate-spin text-[#EC9AA3] mb-3" size={32} />
                    <motion.div 
                      key={loadingMsgIdx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-white font-medium text-sm text-center px-4"
                    >
                      {loadingMessages[loadingMsgIdx]}
                    </motion.div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-red-500/80 text-white backdrop-blur-md transition-all shadow-xl opacity-0 group-hover:opacity-100"
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center px-6"
              >
                <div className="w-16 h-16 rounded-full bg-[rgba(236,154,163,0.05)] flex items-center justify-center mb-4">
                  <UploadCloud size={28} className="text-[#EC9AA3]/60" />
                </div>
                <h3 className="text-[#F8F8FA] font-semibold text-lg mb-1">Upload Screenshot</h3>
                <p className="text-[#B6B8C4]/60 text-sm max-w-[250px]">
                  Drag and drop, click to select, or <strong className="text-white">Ctrl+V to paste</strong> a profile screenshot (PNG, JPG, WEBP).
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm font-medium">
            <X size={16} />
            {error}
          </div>
        )}

        <ScanButton
          onClick={handleScan}
          isScanning={isScanning}
          disabled={!file}
          label="Analyze Profile"
          icon={<ImageIcon size={18} />}
        />
      </div>
    </ScannerLayout>
  );
}
