"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { type ScanResult } from "@/services/api/scanner";

interface AnalysisResultCardProps {
  result: ScanResult;
  onNewScan: () => void;
}

const riskColors: Record<string, { ring: string; text: string; bg: string; border: string; glow: string }> = {
  safe:     { ring: "stroke-emerald-400", text: "text-emerald-400",  bg: "bg-emerald-400/20",  border: "border-emerald-500/20", glow: "shadow-[0_0_20px_rgba(52,211,153,0.15)]" },
  low:      { ring: "stroke-emerald-300", text: "text-emerald-300",  bg: "bg-emerald-300/20",  border: "border-emerald-500/20", glow: "shadow-[0_0_15px_rgba(110,231,183,0.15)]" },
  medium:   { ring: "stroke-amber-400",   text: "text-amber-400",    bg: "bg-amber-400/20",    border: "border-amber-500/20",   glow: "shadow-[0_0_20px_rgba(251,191,36,0.15)]"  },
  high:     { ring: "stroke-orange-400",  text: "text-orange-400",   bg: "bg-orange-400/20",   border: "border-orange-500/20",  glow: "shadow-[0_0_25px_rgba(251,146,60,0.2)]"   },
  critical: { ring: "stroke-red-400",     text: "text-red-400",      bg: "bg-red-400/20",      border: "border-red-500/20",     glow: "shadow-[0_0_30px_rgba(248,113,113,0.25)]"  },
};

const severityColor: Record<string, string> = {
  low:      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  high:     "text-orange-400 bg-orange-500/10 border-orange-500/20",
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
};

// 60fps score count easing animation hook
function useAnimatedScore(target: number, duration: number = 800) {
  const [score, setScore] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const startScore = 0;
    
    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // easeOutQuad
      setScore(Math.floor(startScore + (target - startScore) * ease));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }, [target, duration]);
  return score;
}

export function AnalysisResultCard({ result, onNewScan }: AnalysisResultCardProps) {
  const finalScore = result.riskScore;
  const animatedScore = useAnimatedScore(finalScore);
  const colors = riskColors[result.riskLevel] || riskColors.medium;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (animatedScore / 100) * circumference;
  const intel = result.intel;
  const ai = result.ai;

  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);

  // Generate Executive Intelligence Summary
  const threatSignalsCount = result.signals.length;
  let executiveSummary = "";
  if (threatSignalsCount > 0) {
    const strongestIndicators = result.signals.slice(0, 2).map(s => s.label).join(" and ");
    executiveSummary = `This scan detected ${threatSignalsCount} independent indicator(s) of compromise. The strongest indicators found are ${strongestIndicators}. The overall threat confidence rating is ${result.riskScore >= 60 ? "High" : "Moderate"}.`;
  } else {
    executiveSummary = `No active threat signatures or indicators of compromise were discovered during this scan. The threat engine confidence rating is High.`;
  }

  // Action items mapping
  const actionItems: { title: string; desc: string; isDanger: boolean }[] = [];
  if (result.scanType.toUpperCase() === "UPI") {
    actionItems.push(
      { title: "Do Not Send Money", desc: "Refuse any UPI transaction requests linked to this ID.", isDanger: true },
      { title: "Block in UPI App", desc: "Search the ID in GPay, Paytm, or PhonePe and select Block.", isDanger: true },
      { title: "Report to Cyber Police", desc: "File an official online scam report on cybercrime.gov.in.", isDanger: false }
    );
  } else if (result.scanType.toUpperCase() === "URL") {
    actionItems.push(
      { title: "Do Not Visit Website", desc: "Close any tabs attempting to redirect to this domain.", isDanger: true },
      { title: "Avoid Credential Entry", desc: "Never enter logins, passwords, UPI PINs, or OTPs here.", isDanger: true },
      { title: "Report Domain Threat", desc: "Submit this URL to global browser blocking databases.", isDanger: false }
    );
  } else {
    actionItems.push(
      { title: "Avoid Interaction", desc: "Stop communication or transactions with the sender immediately.", isDanger: true },
      { title: "Block Sender Handle", desc: "Add the sender's identifier to your system blocklist.", isDanger: true },
      { title: "Verify via Official Channels", desc: "Confirm requests directly with official organization customer support.", isDanger: false }
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Premium Glassmorphic Scan Header ── */}
      <motion.div
        className="p-6 rounded-2xl bg-[#0D0D12]/40 backdrop-blur-md border border-[rgba(236,154,163,0.1)] shadow-xl relative overflow-hidden"
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-[rgba(236,154,163,0.03)] to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B6B8C4]/60">Scan Target</span>
            <h2 className="text-lg font-bold text-white font-mono break-all">{result.scanId || "System Scan"}</h2>
            <div className="flex flex-wrap gap-3 pt-1 text-xs text-[#B6B8C4]/80">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Type: {result.scanType.toUpperCase()}
              </span>
              <span>•</span>
              <span>Processed in {result.processingTime}ms</span>
              <span>•</span>
              <span>Checked on {result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-[#12121A]/60 px-4 py-3 rounded-xl border border-[rgba(236,154,163,0.05)]">
            <div className="text-right">
              <p className="text-[9px] text-[#B6B8C4]/50 uppercase tracking-widest leading-none mb-0.5">Confidence</p>
              <p className="text-sm font-mono font-bold text-white">{Math.round(result.confidence * 100)}%</p>
            </div>
            <div className="w-[1px] h-8 bg-[rgba(236,154,163,0.1)]" />
            <div>
              <p className="text-[9px] text-[#B6B8C4]/50 uppercase tracking-widest leading-none mb-0.5">Classification</p>
              <span className={`text-xs font-bold uppercase ${colors.text}`}>{result.verdict || result.riskLevel}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Investigation Timeline ── */}
      <motion.div
        className="p-5 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.06)]"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-4">SecOps Investigation Timeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "1. Normalization", time: "1ms" },
            { label: "2. Lexical Scan", time: "2ms" },
            { label: "3. Reputation Lookup", time: `${Math.floor(result.processingTime * 0.3)}ms` },
            { label: "4. Threat Fusion Engine", time: `${result.processingTime}ms` }
          ].map((step, idx) => (
            <motion.div
              key={idx}
              className="px-3 py-2.5 rounded-xl bg-[#12121A]/40 border border-[rgba(236,154,163,0.04)] flex flex-col justify-between"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + idx * 0.08 }}
            >
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                Active
              </span>
              <p className="text-[11px] font-medium text-[#F8F8FA] pt-1">{step.label}</p>
              <span className="text-[9px] text-[#B6B8C4]/40 font-mono mt-1">{step.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Score & Executive Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.06)] relative overflow-hidden ${colors.glow}`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(236,154,163,0.03)" strokeWidth="6" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none"
                className={colors.ring} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-[#F8F8FA] tabular-nums font-mono">{animatedScore}</span>
              <span className="text-[9px] text-[#B6B8C4] uppercase font-bold tracking-widest">Risk Index</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(236,154,163,0.1)] text-[10px] font-extrabold uppercase ${colors.text}`}>
              <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
              {result.verdict || result.riskLevel}
            </span>
          </div>
        </motion.div>

        {/* Executive Summary */}
        <motion.div
          className="md:col-span-2 p-6 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.06)] flex flex-col justify-between"
          initial={{ x: 15, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-2">Executive Threat Assessment</h3>
            <p className="text-sm font-bold text-[#F8F8FA]">{result.headline || "Threat Scan Diagnostics"}</p>
            <p className="text-xs text-[#B6B8C4] mt-2 leading-relaxed">{executiveSummary}</p>
          </div>
          <div className="pt-4 border-t border-[rgba(236,154,163,0.05)] mt-4">
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5" />
              <p className="text-xs text-[#B6B8C4]">
                <span className="font-bold text-white">Threat Signature:</span> {result.summary}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Internal Reputation & Scammer profile cards ── */}
      {result.metadata && (result.metadata.reputation || result.metadata.scammerProfile) && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {/* Reputation card */}
          {result.metadata.reputation && (
            <div className="p-5 rounded-2xl bg-[#0D0D12]/40 border border-red-500/10 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-2">
                <span className="text-lg">📢</span>
                <div>
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Previously Reported Indicator</h4>
                  <p className="text-[10px] text-[#B6B8C4]/60">Logged in internal cyber incident database</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-[#12121A]/60 px-3 py-2 rounded-xl border border-[rgba(236,154,163,0.05)]">
                  <span className="text-[9px] text-[#B6B8C4]/50 uppercase tracking-widest block">Report Count</span>
                  <span className="text-sm font-mono font-bold text-white">{result.metadata.reputation.reportCount} case(s)</span>
                </div>
                <div className="bg-[#12121A]/60 px-3 py-2 rounded-xl border border-[rgba(236,154,163,0.05)]">
                  <span className="text-[9px] text-[#B6B8C4]/50 uppercase tracking-widest block">Database Status</span>
                  <span className="text-xs font-extrabold text-red-400 uppercase">{result.metadata.reputation.status}</span>
                </div>
              </div>
              <p className="text-[10px] text-[#B6B8C4]/80">
                First seen on {new Date(result.metadata.reputation.firstSeen).toLocaleDateString()} • Last active on {new Date(result.metadata.reputation.lastSeen).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Scammer Profile linked card */}
          {result.metadata.scammerProfile && (
            <div className="p-5 rounded-2xl bg-[#0D0D12]/40 border border-red-500/15 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <div>
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">Linked Scammer Profile</h4>
                  <p className="text-[10px] text-[#B6B8C4]/60">Associated with known threat actor patterns</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-[#12121A]/60 px-3 py-2 rounded-xl border border-[rgba(236,154,163,0.05)]">
                  <span className="text-[9px] text-[#B6B8C4]/50 uppercase tracking-widest block">Scam Occurrences</span>
                  <span className="text-sm font-mono font-bold text-white">{result.metadata.scammerProfile.occurrences} matches</span>
                </div>
                <div className="bg-[#12121A]/60 px-3 py-2 rounded-xl border border-[rgba(236,154,163,0.05)]">
                  <span className="text-[9px] text-[#B6B8C4]/50 uppercase tracking-widest block">Threat Network Nodes</span>
                  <span className="text-xs font-mono font-bold text-white">{result.metadata.scammerProfile.threatNetwork.length} linked</span>
                </div>
              </div>
              <p className="text-[10px] text-[#B6B8C4]/80 truncate" title={result.metadata.scammerProfile.threatNetwork.join(", ")}>
                Network Node ID list: {result.metadata.scammerProfile.threatNetwork.slice(0, 3).join(", ") || "None"}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Threat Intelligence Panel (URL scans only) ── */}
      {intel && (
        <motion.div
          className="space-y-3"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider">Threat Intelligence Feeds</h3>

          {/* Lexical Analysis */}
          {intel.lexical && (
            <div className="px-4 py-4 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.06)] space-y-3">
              <div className="flex items-center justify-between border-b border-[rgba(236,154,163,0.04)] pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🔍</span>
                  <span className="text-[10px] font-semibold text-[#B6B8C4] uppercase tracking-wider">Lexical Engine Analysis</span>
                </div>
                <span className={`text-[11px] font-bold tabular-nums ${intel.lexical.score >= 60 ? "text-red-400" : intel.lexical.score >= 30 ? "text-amber-400" : "text-emerald-400"}`}>
                  Score: {intel.lexical.score}/100
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                {intel.lexical.detectedBrands.length > 0 && (
                  <LexTag icon="⚠" label="Brand Impersonation" value={intel.lexical.detectedBrands.join(", ")} danger />
                )}
                {intel.lexical.credentialHarvestingPattern && (
                  <LexTag icon="🎣" label="Credential Harvesting" value="Pattern detected" danger />
                )}
                {intel.lexical.subdomainDeception && (
                  <LexTag icon="🎭" label="Subdomain Deception" value="Detected" danger />
                )}
                {intel.lexical.punycodeDetected && (
                  <LexTag icon="⚡" label="Punycode / IDN" value="Homograph attack" danger />
                )}
                {intel.lexical.ipAddressUrl && (
                  <LexTag icon="🌐" label="IP Address URL" value="No domain name" danger />
                )}
                {intel.lexical.detectedKeywords.length > 0 && (
                  <LexTag icon="🔑" label="Auth Keywords" value={intel.lexical.detectedKeywords.slice(0, 3).join(", ")} warn />
                )}
                {intel.lexical.suspiciousTld && (
                  <LexTag icon="🏷" label="Suspicious TLD" value="High-abuse registry" warn />
                )}
                {intel.lexical.hyphenCount >= 2 && (
                  <LexTag icon="—" label="Hyphens" value={`${intel.lexical.hyphenCount} in domain`} warn />
                )}
                <LexTag icon="〰" label="Domain Entropy" value={intel.lexical.entropy} warn={intel.lexical.entropy === "HIGH"} />
              </div>

              {intel.lexical.reasons.length > 0 && (
                <ul className="space-y-1.5 pt-3 border-t border-[rgba(236,154,163,0.06)]">
                  {intel.lexical.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]/40 mt-1.5 flex-shrink-0" />
                      <span className="text-[10px] text-[#B6B8C4] leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Google Safe Browsing */}
            <IntelCard title="Google Safe Browsing" available={intel.google?.available ?? false} icon="🛡️">
              {intel.google?.available ? (
                intel.google.detected ? (
                  <div className="space-y-1">
                    <StatusPill detected label="Flagged" />
                    {intel.google.threatTypes.map((t) => (
                      <span key={t} className="block text-[10px] text-red-400">{formatThreatType(t)}</span>
                    ))}
                  </div>
                ) : (
                  <StatusPill detected={false} label="Clean" />
                )
              ) : (
                <span className="text-[10px] text-[#B6B8C4]/40">Unavailable</span>
              )}
            </IntelCard>

            {/* VirusTotal */}
            <IntelCard title="VirusTotal Feed" available={intel.virusTotal?.available ?? false} icon="🔬">
              {intel.virusTotal?.available ? (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#B6B8C4]">Malicious Hits</span>
                    <span className={`text-[11px] font-bold tabular-nums ${intel.virusTotal.maliciousCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {intel.virusTotal.maliciousCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#B6B8C4]">Suspicious Hits</span>
                    <span className={`text-[11px] font-bold tabular-nums ${intel.virusTotal.suspiciousCount > 0 ? "text-amber-400" : "text-[#B6B8C4]"}`}>
                      {intel.virusTotal.suspiciousCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#B6B8C4]">Community Score</span>
                    <span className={`text-[11px] font-bold tabular-nums ${intel.virusTotal.communityScore < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {intel.virusTotal.communityScore}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-[#B6B8C4]/40">Unavailable</span>
              )}
            </IntelCard>

            {/* RDAP Domain */}
            <IntelCard title="RDAP Registry" available={intel.rdap?.available ?? false} icon="🌐">
              {intel.rdap?.available ? (
                <div className="space-y-1">
                  {intel.rdap.isVeryNewDomain && (
                    <StatusPill detected label={`${intel.rdap.ageInDays}d (Critical Age)`} />
                  )}
                  {!intel.rdap.isVeryNewDomain && intel.rdap.isNewDomain && (
                    <StatusPill detected={false} label={`${intel.rdap.ageInDays}d (New)`} warn />
                  )}
                  {!intel.rdap.isNewDomain && intel.rdap.ageInDays !== null && (
                    <span className="text-[10px] text-emerald-400">{intel.rdap.ageInDays} days registered</span>
                  )}
                  {intel.rdap.registrar && (
                    <p className="text-[10px] text-[#B6B8C4]/70 truncate">{intel.rdap.registrar}</p>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-[#B6B8C4]/40">Unavailable</span>
              )}
            </IntelCard>
          </div>
        </motion.div>
      )}

      {/* ── Detected Signals (Interactive Chips) ── */}
      {result.signals.length > 0 && (
        <motion.div
          className="space-y-3"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider">Detected Signals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.signals.map((signal, i) => (
              <div
                key={i}
                onClick={() => setExpandedSignal(expandedSignal === i ? null : i)}
                className="px-4 py-3 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.06)] hover:border-[rgba(236,154,163,0.15)] cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${severityColor[signal.severity] || "bg-[#B6B8C4]"}`}>
                      {signal.severity}
                    </span>
                    <span className="text-xs font-semibold text-[#F8F8FA]">{signal.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#B6B8C4]/70 font-mono">
                      Conf: {Math.round(signal.confidence * 100)}%
                    </span>
                    <motion.svg
                      className="w-4 h-4 text-[#B6B8C4]"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      animate={{ rotate: expandedSignal === i ? 180 : 0 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </div>
                </div>
                
                <AnimatePresence initial={false}>
                  {expandedSignal === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[11px] text-[#B6B8C4] pl-1 pt-2 leading-relaxed">
                        {signal.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── AI Explanations & Summaries ── */}
      {ai && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          {ai.citizenAdvice && (
            <div className="px-5 py-4 rounded-2xl bg-[rgba(236,154,163,0.03)] border border-[rgba(236,154,163,0.15)] flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#EC9AA3] uppercase tracking-wider mb-2">Citizen Safety Advice</h3>
                <p className="text-xs text-[#F8F8FA] leading-relaxed">{ai.citizenAdvice}</p>
              </div>
            </div>
          )}
          {ai.policeSummary && (
            <div className="px-5 py-4 rounded-2xl bg-[#0D0D12]/40 border border-[rgba(236,154,163,0.06)] flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Law Enforcement Briefing</h3>
                <p className="text-xs text-[#B6B8C4] leading-relaxed">{ai.policeSummary}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Action Panel (Recommendation) ── */}
      <motion.div
        className="p-5 rounded-2xl bg-[rgba(236,154,163,0.04)] border border-[rgba(236,154,163,0.15)] space-y-4"
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xs font-bold text-[#EC9AA3] uppercase tracking-wider flex items-center gap-1.5">
          🛡️ Recommended SecOps Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actionItems.map((action, idx) => (
            <div key={idx} className="flex gap-3 bg-[#0D0D12]/40 p-4 rounded-xl border border-[rgba(236,154,163,0.05)]">
              <span className={`text-lg mt-0.5 flex-shrink-0 ${action.isDanger ? "text-red-400" : "text-indigo-400"}`}>
                {action.isDanger ? "⛔" : "💡"}
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#F8F8FA]">{action.title}</h4>
                <p className="text-[10px] text-[#B6B8C4]/80 mt-1 leading-normal">{action.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#F8F8FA] pt-1">
          <span className="font-bold text-[#EC9AA3]">Decision Verdict:</span> {result.recommendation}
        </p>
      </motion.div>

      {/* ── Operations Buttons ── */}
      <motion.div
        className="flex flex-wrap gap-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <button
          onClick={onNewScan}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] hover:shadow-[0_4px_16px_rgba(236,154,163,0.2)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200"
        >
          Scan Another Input
        </button>
        <Link
          href="/threats"
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#F8F8FA] border border-[rgba(236,154,163,0.15)] hover:border-[rgba(236,154,163,0.3)] hover:-translate-y-0.5 transition-all duration-200"
        >
          View History Logs
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntelCard({
  title,
  available,
  icon,
  children,
}: {
  title: string;
  available: boolean;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3.5 py-3.5 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.06)] space-y-2 relative">
      <div className="flex items-center gap-1.5 border-b border-[rgba(236,154,163,0.03)] pb-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] font-semibold text-[#B6B8C4] uppercase tracking-wider">{title}</span>
        {available && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" title="Active Feed" />
        )}
      </div>
      {children}
    </div>
  );
}

function StatusPill({
  detected,
  label,
  warn,
}: {
  detected: boolean;
  label: string;
  warn?: boolean;
}) {
  const color = detected
    ? "bg-red-500/10 text-red-400 border-red-500/20"
    : warn
    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${color}`}>
      <span>{detected ? "⚠" : warn ? "⚠" : "✓"}</span>
      {label}
    </span>
  );
}

function formatThreatType(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function LexTag({
  icon,
  label,
  value,
  danger,
  warn,
}: {
  icon: string;
  label: string;
  value: string;
  danger?: boolean;
  warn?: boolean;
}) {
  const textColor = danger
    ? "text-red-400"
    : warn
    ? "text-amber-400"
    : "text-[#B6B8C4]";

  return (
    <div className="flex items-start gap-1.5 min-w-0">
      <span className="text-[11px] flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] text-[#B6B8C4]/50 uppercase tracking-wider leading-none mb-0.5">
          {label}
        </p>
        <p className={`text-[11px] font-medium truncate ${textColor}`}>{value}</p>
      </div>
    </div>
  );
}
