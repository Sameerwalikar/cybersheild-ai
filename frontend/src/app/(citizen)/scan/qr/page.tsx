"use client";

import { useState, useCallback } from "react";
import { ScannerLayout, ScanButton } from "@/components/scanner";
import { scannerApi, type ScanResult } from "@/services/api/scanner";
import { AnalysisResultCard } from "@/components/scanner/AnalysisResultCard";

export default function QRScannerPage() {
  const [decodedContent, setDecodedContent] = useState("");
  const [contentType, setContentType] = useState<"url" | "upi" | "text">("text");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scannerApi.scanQr(decodedContent, contentType);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ScannerLayout title="Scan QR Code" description="Analysis complete.">
        <AnalysisResultCard result={result} onNewScan={() => { setResult(null); setDecodedContent(""); }} />
      </ScannerLayout>
    );
  }

  return (
    <ScannerLayout title="Scan QR Code" description="Enter the decoded QR content to analyze for threats." helpTips={["QR codes can hide malicious URLs.", "Never scan QR codes from untrusted sources.", "Payment QR codes should only be scanned in trusted apps.", "Verify the decoded content before visiting any URL."]}>
      <div className="space-y-4">
        <div>
          <label htmlFor="qr-type" className="block text-xs font-medium text-[#B6B8C4] mb-1.5">Content Type</label>
          <select id="qr-type" value={contentType} onChange={(e) => setContentType(e.target.value as any)} className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] focus:outline-none focus:border-[rgba(236,154,163,0.4)] transition-all duration-200 appearance-none">
            <option value="text" className="bg-[#0D0D12]">Text</option>
            <option value="url" className="bg-[#0D0D12]">URL</option>
            <option value="upi" className="bg-[#0D0D12]">UPI</option>
          </select>
        </div>
        <div>
          <label htmlFor="qr-content" className="block text-xs font-medium text-[#B6B8C4] mb-1.5">Decoded QR Content</label>
          <textarea
            id="qr-content"
            value={decodedContent}
            onChange={(e) => setDecodedContent(e.target.value)}
            placeholder="Paste the decoded QR code content here..."
            className="w-full h-28 px-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:shadow-[0_0_0_3px_rgba(236,154,163,0.08)] transition-all duration-200 resize-none"
          />
        </div>
        {error && <p className="text-xs text-red-400 px-1">{error}</p>}
        <ScanButton label="Analyze QR Content" disabled={decodedContent.length === 0} loading={loading} onClick={handleScan} />
      </div>
    </ScannerLayout>
  );
}
