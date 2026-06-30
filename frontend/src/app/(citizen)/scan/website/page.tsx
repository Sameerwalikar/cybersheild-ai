"use client";

import { useState } from "react";
import { ScannerLayout, ScanButton } from "@/components/scanner";
import { scannerApi, type ScanResult } from "@/services/api/scanner";
import { AnalysisResultCard } from "@/components/scanner/AnalysisResultCard";

export default function WebsiteScannerPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isValid = /^https?:\/\/.+\..+/.test(url);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scannerApi.scanWebsite(url);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ScannerLayout title="Scan Website" description="Analysis complete.">
        <AnalysisResultCard result={result} onNewScan={() => { setResult(null); setUrl(""); }} />
      </ScannerLayout>
    );
  }

  return (
    <ScannerLayout title="Scan Website" description="Enter a URL to check for malicious content, phishing pages, or unsafe redirects." helpTips={["Always check if the URL uses HTTPS.", "Beware of look-alike domains.", "Shortened URLs can hide malicious destinations.", "Check domain age — new domains are often suspicious."]}>
      <div className="space-y-4">
        <div>
          <label htmlFor="url-input" className="block text-xs font-medium text-[#B6B8C4] mb-1.5">Website URL</label>
          <input id="url-input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:shadow-[0_0_0_3px_rgba(236,154,163,0.08)] transition-all duration-200" />
          <p className="text-[10px] text-[#B6B8C4]/50 mt-1.5">Enter the full URL including https://</p>
          {url.length > 0 && !isValid && <p className="text-[10px] text-red-400 mt-1">Please enter a valid URL.</p>}
        </div>
        {error && <p className="text-xs text-red-400 px-1">{error}</p>}
        <ScanButton label="Analyze URL" disabled={!isValid} loading={loading} onClick={handleScan} />
      </div>
    </ScannerLayout>
  );
}
