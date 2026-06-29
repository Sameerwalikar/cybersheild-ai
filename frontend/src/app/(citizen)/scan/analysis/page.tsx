"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  RiskScoreRing,
  ThreatBreakdown,
  EvidencePanel,
  RecommendationsList,
  AnalysisTimeline,
  ConfidencePanel,
  LoadingAnalysis,
  mockAnalysis,
} from "@/components/analysis";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const scanTypeLabels: Record<string, string> = {
  message: "Message Scan",
  url: "Website Scan",
  qr: "QR Code Scan",
  upi: "UPI Verification",
  voice: "Voice Analysis",
};

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const data = mockAnalysis;

  const handleLoadComplete = useCallback(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingAnalysis onComplete={handleLoadComplete} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <div>
          <Link href="/scan" className="inline-flex items-center gap-1.5 text-xs text-[#B6B8C4] hover:text-[#EC9AA3] transition-colors mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Scanner
          </Link>
          <h1 className="text-xl font-bold text-[#F8F8FA]">Threat Analysis</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-[#B6B8C4] font-mono">{data.id}</span>
            <span className="text-[10px] text-[#B6B8C4]">•</span>
            <span className="text-[10px] text-[#B6B8C4]">{scanTypeLabels[data.scanType]}</span>
            <span className="text-[10px] text-[#B6B8C4]">•</span>
            <span className="text-[10px] text-[#B6B8C4]">{data.processingTime}ms</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400">Analysis Complete</span>
        </div>
      </motion.div>

      {/* Risk Score + Summary row */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 p-6 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
      >
        <RiskScoreRing score={data.riskScore} level={data.riskLevel} />
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider">AI Summary</h2>
          <p className="text-sm text-[#F8F8FA] leading-relaxed">{data.summary}</p>
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div
        className="p-4 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease }}
      >
        <h2 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Analysis Timeline</h2>
        <AnalysisTimeline steps={data.timeline} />
      </motion.div>

      {/* Two column: Threats + Confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease }}
        >
          <h2 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Threat Breakdown</h2>
          <ThreatBreakdown threats={data.threats} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease }}
        >
          <h2 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Confidence</h2>
          <ConfidencePanel confidence={data.confidence} />
        </motion.div>
      </div>

      {/* Evidence */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease }}
      >
        <h2 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Evidence</h2>
        <EvidencePanel evidence={data.evidence} />
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease }}
      >
        <h2 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Recommendations</h2>
        <RecommendationsList recommendations={data.recommendations} />
      </motion.div>

      {/* Related Threats */}
      <motion.div
        className="p-4 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease }}
      >
        <h2 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Related Intelligence</h2>
        <div className="space-y-2">
          {data.relatedThreats.map((rt) => (
            <div key={rt.id} className="flex items-center justify-between py-2 border-b border-[rgba(236,154,163,0.04)] last:border-0">
              <span className="text-[11px] text-[#B6B8C4]">{rt.description}</span>
              <span className="text-[10px] font-bold text-[#EC9AA3] tabular-nums">{rt.count}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex flex-wrap gap-3 pt-2 pb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease }}
      >
        <Link href="/scan" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] hover:shadow-[0_4px_16px_rgba(236,154,163,0.2)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200">
          Analyze Another
        </Link>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#F8F8FA] border border-[rgba(236,154,163,0.15)] hover:border-[rgba(236,154,163,0.3)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200">
          Save Result
        </button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#B6B8C4] hover:text-[#F8F8FA] active:scale-[0.97] transition-all duration-200">
          Download Report
        </button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#B6B8C4] hover:text-[#F8F8FA] active:scale-[0.97] transition-all duration-200">
          Report to Police
        </button>
      </motion.div>
    </div>
  );
}
