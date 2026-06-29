"use client";

import { useState, useCallback } from "react";
import { ScannerLayout, ScanButton } from "@/components/scanner";

export default function QRScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  return (
    <ScannerLayout
      title="Scan QR Code"
      description="Upload a QR code image to decode and analyze it for malicious URLs or payment fraud."
      helpTips={[
        "QR codes can hide malicious URLs.",
        "Never scan QR codes from untrusted sources.",
        "Payment QR codes should only be scanned in trusted apps.",
        "Verify the decoded content before visiting any URL.",
      ]}
    >
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragOver
              ? "border-[#EC9AA3] bg-[rgba(236,154,163,0.04)]"
              : "border-[rgba(236,154,163,0.12)] hover:border-[rgba(236,154,163,0.25)]"
          }`}
        >
          {preview ? (
            <div className="space-y-3">
              <img src={preview} alt="QR preview" className="max-w-[160px] max-h-[160px] mx-auto rounded-lg border border-[rgba(236,154,163,0.1)]" />
              <p className="text-xs text-[#B6B8C4]">{file?.name}</p>
              <button onClick={() => { setFile(null); setPreview(null); }} className="text-[10px] text-[#EC9AA3] hover:text-[#F3B3BA]">
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#12121A] border border-[rgba(236,154,163,0.1)] flex items-center justify-center mx-auto text-[#EC9AA3]/50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              </div>
              <p className="text-sm text-[#B6B8C4]">Drag & drop QR image here</p>
              <p className="text-[10px] text-[#B6B8C4]/50">PNG, JPG, WEBP — Max 5MB</p>
              <label className="inline-block px-4 py-2 rounded-lg text-xs font-medium text-[#EC9AA3] border border-[rgba(236,154,163,0.2)] hover:bg-[rgba(236,154,163,0.04)] cursor-pointer transition-colors">
                Choose File
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </label>
            </div>
          )}
        </div>

        <ScanButton label="Decode & Analyze" disabled={!file} />
      </div>
    </ScannerLayout>
  );
}
