"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { type ScanResult } from "@/services/api/scanner";

interface AnalysisResultCardProps {
  result: ScanResult;
  onNewScan: () => void;
}

const riskColors: Record<string, { ring: string; text: string; bg: string }> = {
  safe: { ring: "stroke-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400" },
  low: { ring: "stroke-emerald-300", text: "text-emerald-300", bg: "bg-emerald-300" },
  medium: { ring: "stroke-amber-400", text: "text-amber-400", bg: "bg-amber-400" },
  high: { ring: "stroke-orange-400", text: "text-orange-400", bg: "bg-orange-400" },
  critical: { ring: "stroke-red-400", text: "text-red-400", bg: "bg-red-400" },
};

const severityDot: Record<string, string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-red-400",
};

export function AnalysisResultCard({ result, onNewScan }: AnalysisResultCardProps) {
  const colors = riskColors[result.riskLevel] || riskColors.medium;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (result.riskScore / 100) * circumference;

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.03, 0.26, 1] }}
    >
      {/* Score + Summary */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)]">
        {/* Ring */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(236,154,163,0.06)" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" className={colors.ring} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#F8F8FA] tabular-nums">{result.riskScore}</span>
            <span className="text-[9px] text-[#B6B8C4] uppercase">Risk</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[rgba(236,154,163,0.1)] mb-2">
            <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
            <span className={`text-[10px] font-bold uppercase ${colors.text}`}>{result.riskLevel}</span>
          </div>
          <p className="text-sm text-[#F8F8FA] leading-relaxed">{result.summary}</p>
          <p className="text-[10px] text-[#B6B8C4]/60 mt-2 tabular-nums">
            Confidence: {Math.round(result.confidence * 100)}% • {result.processingTime}ms
          </p>
        </div>
      </div>

      {/* Signals */}
      {result.signals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider">Detected Signals</h3>
          {result.signals.map((signal, i) => (
            <div key={i} className="px-4 py-3 rounded-xl bg-[#12121A]/60 border border-[rgba(236,154,163,0.06)]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${severityDot[signal.severity] || "bg-[#B6B8C4]"}`} />
                  <span className="text-xs font-medium text-[#F8F8FA]">{signal.label}</span>
                </div>
                <span className="text-[10px] text-[#B6B8C4] tabular-nums">{Math.round(signal.confidence * 100)}%</span>
              </div>
              <p className="text-[11px] text-[#B6B8C4] pl-4">{signal.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      <div className="px-4 py-3 rounded-xl bg-[rgba(236,154,163,0.04)] border border-[rgba(236,154,163,0.1)]">
        <h3 className="text-xs font-semibold text-[#EC9AA3] uppercase tracking-wider mb-1">Recommendation</h3>
        <p className="text-xs text-[#F8F8FA]">{result.recommendation}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button onClick={onNewScan} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] hover:shadow-[0_4px_16px_rgba(236,154,163,0.2)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200">
          Scan Another
        </button>
        <Link href="/threats" className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#F8F8FA] border border-[rgba(236,154,163,0.15)] hover:border-[rgba(236,154,163,0.3)] hover:-translate-y-0.5 transition-all duration-200">
          View History
        </Link>
      </div>
    </motion.div>
  );
}
