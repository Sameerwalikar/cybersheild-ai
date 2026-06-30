"use client";

import { useState } from "react";
import { ScannerLayout, ScanButton } from "@/components/scanner";
import { scannerApi, type ScanResult } from "@/services/api/scanner";
import { AnalysisResultCard } from "@/components/scanner/AnalysisResultCard";

export default function UPIScannerPage() {
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isValid = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(upiId);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scannerApi.scanUpi(upiId);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ScannerLayout title="Scan UPI ID" description="Analysis complete.">
        <AnalysisResultCard result={result} onNewScan={() => { setResult(null); setUpiId(""); }} />
      </ScannerLayout>
    );
  }

  return (
    <ScannerLayout title="Scan UPI ID" description="Verify UPI IDs against known fraud databases and pattern analysis." helpTips={["Verify UPI IDs before making payments.", "Scammers often use IDs that mimic legitimate services.", "Never accept collect requests from unknown IDs.", "Report suspicious UPI IDs to help protect others."]}>
      <div className="space-y-4">
        <div>
          <label htmlFor="upi-input" className="block text-xs font-medium text-[#B6B8C4] mb-1.5">UPI ID</label>
          <input id="upi-input" type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="example@upi" className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:shadow-[0_0_0_3px_rgba(236,154,163,0.08)] transition-all duration-200" />
          <p className="text-[10px] text-[#B6B8C4]/50 mt-1.5">Format: username@bankname (e.g., name@ybl)</p>
          {upiId.length > 0 && !isValid && <p className="text-[10px] text-red-400 mt-1">Please enter a valid UPI ID format.</p>}
        </div>
        {error && <p className="text-xs text-red-400 px-1">{error}</p>}
        <ScanButton label="Verify UPI ID" disabled={!isValid} loading={loading} onClick={handleScan} />
      </div>
    </ScannerLayout>
  );
}
