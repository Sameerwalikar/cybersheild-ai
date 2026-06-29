"use client";

import { useState, useCallback } from "react";
import { ScannerLayout, ScanButton } from "@/components/scanner";

export default function VoiceScannerPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleFile = useCallback((f: File) => {
    const validTypes = ["audio/wav", "audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/mp3"];
    if (!validTypes.some((t) => f.type.includes(t.split("/")[1]))) return;
    setFile(f);
  }, []);

  return (
    <ScannerLayout
      title="Voice Analysis"
      description="Upload a recorded phone call to analyze for social engineering and vishing patterns."
      helpTips={[
        "Never trust callers claiming to be from banks or police.",
        "AI-generated voices can mimic real people.",
        "Urgency in calls is a major red flag.",
        "Record suspicious calls (where legal) for analysis.",
      ]}
    >
      <div className="space-y-4">
        {/* Upload zone */}
        <div className="border-2 border-dashed border-[rgba(236,154,163,0.12)] hover:border-[rgba(236,154,163,0.25)] rounded-xl p-8 text-center transition-all duration-200">
          {file ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[rgba(236,154,163,0.06)] border border-[rgba(236,154,163,0.15)] flex items-center justify-center mx-auto">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC9AA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
              </div>
              <p className="text-xs text-[#F8F8FA] font-medium">{file.name}</p>
              <p className="text-[10px] text-[#B6B8C4]">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <button onClick={() => setFile(null)} className="text-[10px] text-[#EC9AA3] hover:text-[#F3B3BA]">Remove</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#12121A] border border-[rgba(236,154,163,0.1)] flex items-center justify-center mx-auto text-[#EC9AA3]/50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
              </div>
              <p className="text-sm text-[#B6B8C4]">Upload audio recording</p>
              <p className="text-[10px] text-[#B6B8C4]/50">WAV, MP3, M4A — Max 60 seconds, 25MB</p>
              <label className="inline-block px-4 py-2 rounded-lg text-xs font-medium text-[#EC9AA3] border border-[rgba(236,154,163,0.2)] hover:bg-[rgba(236,154,163,0.04)] cursor-pointer transition-colors">
                Choose Audio File
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </label>
            </div>
          )}
        </div>

        <ScanButton label="Analyze Voice" disabled={!file} />
      </div>
    </ScannerLayout>
  );
}
