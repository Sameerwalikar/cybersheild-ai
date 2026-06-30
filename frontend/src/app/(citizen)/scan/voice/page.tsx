"use client";

import { useState } from "react";
import { ScannerLayout, ScanButton } from "@/components/scanner";
import { scannerApi, type ScanResult } from "@/services/api/scanner";
import { AnalysisResultCard } from "@/components/scanner/AnalysisResultCard";

export default function VoiceScannerPage() {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scannerApi.scanVoice(transcript);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ScannerLayout title="Voice Analysis" description="Analysis complete.">
        <AnalysisResultCard result={result} onNewScan={() => { setResult(null); setTranscript(""); }} />
      </ScannerLayout>
    );
  }

  return (
    <ScannerLayout title="Voice Analysis" description="Paste a transcript of a suspicious phone call to analyze for social engineering patterns." helpTips={["Never trust callers claiming to be from banks or police.", "AI-generated voices can mimic real people.", "Urgency in calls is a major red flag.", "Record suspicious calls (where legal) for analysis."]}>
      <div className="space-y-4">
        <div>
          <label htmlFor="transcript" className="block text-xs font-medium text-[#B6B8C4] mb-1.5">Call Transcript</label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value.slice(0, 10000))}
            placeholder="Paste the call transcript or type what the caller said..."
            className="w-full h-40 px-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:shadow-[0_0_0_3px_rgba(236,154,163,0.08)] transition-all duration-200 resize-none"
          />
          <span className="text-[10px] text-[#B6B8C4]/50 tabular-nums">{transcript.length}/10000</span>
        </div>
        {error && <p className="text-xs text-red-400 px-1">{error}</p>}
        <ScanButton label="Analyze Voice" disabled={transcript.length === 0} loading={loading} onClick={handleScan} />
      </div>
    </ScannerLayout>
  );
}
