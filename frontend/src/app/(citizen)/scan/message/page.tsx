"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScannerLayout, ScanButton } from "@/components/scanner";
import { scannerApi, type ScanResult } from "@/services/api/scanner";
import { AnalysisResultCard } from "@/components/scanner/AnalysisResultCard";

export default function MessageScannerPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const MAX_CHARS = 5000;

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scannerApi.scanMessage(input);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ScannerLayout title="Scan Message" description="Analysis complete.">
        <AnalysisResultCard result={result} onNewScan={() => { setResult(null); setInput(""); }} />
      </ScannerLayout>
    );
  }

  return (
    <ScannerLayout title="Scan Message" description="Paste suspicious SMS, WhatsApp, or email messages to analyze for phishing and scam indicators.">
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Paste suspicious SMS, WhatsApp or Email here..."
            className="w-full h-48 px-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:shadow-[0_0_0_3px_rgba(236,154,163,0.08)] transition-all duration-200 resize-none"
            aria-label="Message content to scan"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-[#B6B8C4]/60 tabular-nums">{input.length}/{MAX_CHARS}</span>
            {input.length > 0 && (
              <button onClick={() => setInput("")} className="text-[10px] text-[#EC9AA3] hover:text-[#F3B3BA] transition-colors">Clear</button>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-red-400 px-1">{error}</p>}

        <ScanButton label="Analyze Message" disabled={input.length === 0} loading={loading} onClick={handleScan} />
      </div>
    </ScannerLayout>
  );
}
