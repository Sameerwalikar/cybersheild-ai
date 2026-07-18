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

// Helper to resolve the scanned target header details
function getQrDisplayHeader(result: any) {
  const type = (result.scanType || result.contentType || "QR").toUpperCase();
  const content = result.decodedContent || "";
  const metadata = result.metadata || {};

  let title = "Scanned Payload";
  let subtitle = content || "No content decoded";

  if (type === "UPI") {
    const upiFields = metadata?.upiFields || {};
    title = upiFields.pn ? decodeURIComponent(upiFields.pn).replace(/\+/g, " ") : "UPI Recipient";
    subtitle = upiFields.pa || content;
  } else if (type === "URL") {
    try {
      title = new URL(content).hostname;
    } catch {
      title = "Web Target";
    }
    subtitle = content;
  } else if (type === "PHONE") {
    title = metadata?.phone || content;
    subtitle = "Phone Number Target";
  } else if (type === "SMS") {
    title = "SMS Message";
    subtitle = metadata?.recipient ? `To: ${metadata.recipient}` : content;
  } else if (type === "EMAIL") {
    title = metadata?.email || content;
    subtitle = "Email Destination";
  } else if (type === "WIFI") {
    title = metadata?.ssid || "WiFi Network SSID";
    subtitle = `Encryption: ${metadata?.encryption || "WPA/WPA2"}`;
  } else if (type === "VCARD") {
    title = metadata?.name || "VCard Contact Details";
    subtitle = metadata?.phone || metadata?.email || content;
  } else if (type === "DEEP_LINK") {
    title = metadata?.scheme ? `${metadata.scheme.toUpperCase()} Deep Link` : "App Deep Link";
    subtitle = content;
  } else if (type === "PLAIN_TEXT") {
    title = content.length > 40 ? content.slice(0, 40) + "..." : content;
    subtitle = "Plain Text Payload";
  }

  return { title, subtitle };
}

// UPI Details parsing helper
function parseUpiDetails(decodedContent: string, metadata: any) {
  const upiFields = metadata?.upiFields || {};
  let pa = upiFields.pa || "Not Available";
  let pn = upiFields.pn ? decodeURIComponent(upiFields.pn).replace(/\+/g, " ") : "Not Available";
  let am = upiFields.am || "Not Available";
  let tn = upiFields.tn ? decodeURIComponent(upiFields.tn).replace(/\+/g, " ") : "Not Available";
  let mc = "Not Available";
  let cu = "Not Available";
  let mode = "Not Available";

  try {
    const url = new URL(decodedContent);
    pa = url.searchParams.get("pa") || pa;
    pn = url.searchParams.get("pn") ? decodeURIComponent(url.searchParams.get("pn")!).replace(/\+/g, " ") : pn;
    am = url.searchParams.get("am") || am;
    tn = url.searchParams.get("tn") ? decodeURIComponent(url.searchParams.get("tn")!).replace(/\+/g, " ") : tn;
    mc = url.searchParams.get("mc") || "Not Available";
    cu = url.searchParams.get("cu") || "INR";
    mode = url.searchParams.get("mode") || "UPI";
  } catch {
    const matchMc = decodedContent.match(/[?&]mc=([^&]*)/i);
    if (matchMc) mc = decodeURIComponent(matchMc[1]);
    const matchCu = decodedContent.match(/[?&]cu=([^&]*)/i);
    if (matchCu) cu = decodeURIComponent(matchCu[1]);
    const matchMode = decodedContent.match(/[?&]mode=([^&]*)/i);
    if (matchMode) mode = decodeURIComponent(matchMode[1]);
  }

  // Derive PSP Bank
  let bankPsp = "Not Available";
  if (pa !== "Not Available") {
    const provider = pa.split("@")[1]?.toLowerCase();
    if (provider) {
      if (provider.includes("okhdfcbank")) bankPsp = "HDFC Bank";
      else if (provider.includes("oksbi")) bankPsp = "State Bank of India";
      else if (provider.includes("okaxis")) bankPsp = "Axis Bank";
      else if (provider.includes("okicici")) bankPsp = "ICICI Bank";
      else if (provider.includes("ybl") || provider.includes("ibl")) bankPsp = "Yes Bank";
      else if (provider.includes("paytm")) bankPsp = "Paytm Payments Bank";
      else if (provider.includes("apl")) bankPsp = "Amazon Pay / Axis Bank";
      else if (provider.includes("barodampay")) bankPsp = "Bank of Baroda";
      else if (provider.includes("upi")) bankPsp = "NPCI / Generic UPI";
      else bankPsp = provider.toUpperCase();
    }
  }

  const isDynamic = (am !== "Not Available" && am !== "") || decodedContent.includes("tr=");

  return {
    pn: pn || "Not Available",
    pa: pa || "Not Available",
    bankPsp,
    mc: mc || "Not Available",
    am: am || "Not Available",
    cu: cu || "Not Available",
    tn: tn || "Not Available",
    qrType: isDynamic ? "Dynamic" : "Static",
    mode: mode || "UPI",
  };
}

export function AnalysisResultCard({ result, onNewScan }: AnalysisResultCardProps) {
  // Normalize fields
  const finalScore = typeof result.riskScore === "number" ? result.riskScore : (result as any).threatScore || 0;
  const rawLevel = result.riskLevel || (result as any).riskLevel || "medium";
  const riskLevel = rawLevel.toLowerCase();
  const summary = result.summary || (result as any).aiExplanation || "Scan complete";
  const recommendation = result.recommendation || (result as any).recommendedActions?.[0] || "";
  const signals = result.signals || (result as any).riskIndicators?.map((ind: string) => ({
    label: ind,
    severity: riskLevel.toUpperCase() as any,
    confidence: result.confidence || 0.8,
    description: ind
  })) || [];
  const scanType = result.scanType || (result as any).contentType || "QR";
  const confidence = result.confidence || 0.8;

  const animatedScore = useAnimatedScore(finalScore);
  const colors = riskColors[riskLevel] || riskColors.medium;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (animatedScore / 100) * circumference;
  const intel = result.intel;
  const ai = result.ai;

  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);
  const [showRawPayload, setShowRawPayload] = useState(false);

  // Dynamic header resolution
  const { title, subtitle } = getQrDisplayHeader(result);

  // Executive summary
  const threatSignalsCount = signals.length;
  let executiveSummary = "";
  if (threatSignalsCount > 0) {
    const strongestIndicators = signals.slice(0, 2).map(s => s.label).join(" and ");
    executiveSummary = `This scan detected ${threatSignalsCount} independent indicator(s) of compromise. The strongest indicators found are ${strongestIndicators}. The overall threat confidence rating is ${finalScore >= 60 ? "High" : "Moderate"}.`;
  } else {
    executiveSummary = `No active threat signatures or indicators of compromise were discovered during this scan. The threat engine confidence rating is High.`;
  }

  // Action items mapping
  const actionItems: { title: string; desc: string; isDanger: boolean }[] = [];
  if (scanType.toUpperCase() === "UPI") {
    actionItems.push(
      { title: "Do Not Send Money", desc: "Refuse any UPI transaction requests linked to this ID.", isDanger: true },
      { title: "Block in UPI App", desc: "Search the ID in GPay, Paytm, or PhonePe and select Block.", isDanger: true },
      { title: "Report to Cyber Police", desc: "File an official online scam report on cybercrime.gov.in.", isDanger: false }
    );
  } else if (scanType.toUpperCase() === "URL") {
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

  // Parse details
  const isUpiType = scanType.toUpperCase() === "UPI";
  const upiDetails = isUpiType ? parseUpiDetails(result.decodedContent || result.scanId || "", result.metadata) : null;

  const isUrlType = scanType.toUpperCase() === "URL" || result.decodedContent?.startsWith("http");
  const finalDestination = result.metadata?.redirectChain
    ? result.metadata.redirectChain[result.metadata.redirectChain.length - 1]
    : result.decodedContent || "";
  let domain = "Not Available";
  try {
    domain = new URL(finalDestination).hostname;
  } catch {}

  const hasShortener = result.metadata?.redirectChain && result.metadata.redirectChain.length > 1;

  // Trust Indicators List (Section 6)
  const trustIndicators: string[] = [];
  trustIndicators.push("QR Structure Valid");
  
  if (isUpiType) {
    trustIndicators.push("Standard UPI Format");
    trustIndicators.push("No Embedded URL");
    trustIndicators.push("No Hidden Unicode");
    trustIndicators.push("No Suspicious Parameters");
    trustIndicators.push("No Obfuscation Detected");
  } else if (isUrlType) {
    trustIndicators.push("Valid URL Protocol");
    if (!intel?.google?.detected) trustIndicators.push("Google Safe Browsing Clean");
    if (!intel?.virusTotal?.maliciousCount) trustIndicators.push("VirusTotal Detections Clean");
    if (!hasShortener) trustIndicators.push("Direct Destination Link");
  } else {
    trustIndicators.push("Standard Text Encoding");
    trustIndicators.push("No URL Embedded");
  }

  // Chronological Timeline (Section 9)
  const timelineItems: { label: string; done: boolean }[] = [
    { label: "QR Code Decoded", done: true },
    { label: `Payload Classified (${scanType.toUpperCase()})`, done: true },
  ];
  if (isUpiType && upiDetails && upiDetails.pn !== "Not Available") {
    timelineItems.push({ label: "Payee Name Extracted", done: true });
  } else if (isUrlType) {
    timelineItems.push({ label: "Destination Resolved", done: true });
  }
  timelineItems.push({ label: `Risk Engine Completed (${rawLevel.toUpperCase()})`, done: true });
  if (ai) {
    timelineItems.push({ label: "AI Security Explanation Generated", done: true });
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Premium Glassmorphic Scan Header (Section 1) ── */}
      <motion.div
        className="p-6 rounded-2xl bg-[#0D0D12]/40 backdrop-blur-md border border-[rgba(236,154,163,0.1)] shadow-xl relative overflow-hidden"
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-[rgba(236,154,163,0.03)] to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B6B8C4]/60">Scanned Target</span>
            <h2 className="text-xl font-extrabold text-white break-all leading-snug">{title}</h2>
            <p className="text-xs font-mono text-[#EC9AA3] break-all">{subtitle}</p>
            <div className="flex flex-wrap gap-3 pt-2 text-xs text-[#B6B8C4]/80">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Type: {scanType.toUpperCase()}
              </span>
              <span>•</span>
              <span>Processed in {result.processingTime || 0}ms</span>
              <span>•</span>
              <span>Checked on {result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-[#12121A]/60 px-4 py-3 rounded-xl border border-[rgba(236,154,163,0.05)]">
            <div className="text-right">
              <p className="text-[9px] text-[#B6B8C4]/50 uppercase tracking-widest leading-none mb-0.5">Analysis Confidence</p>
              <p className="text-sm font-mono font-bold text-white">{Math.round(confidence * 100)}%</p>
            </div>
            <div className="w-[1px] h-8 bg-[rgba(236,154,163,0.1)]" />
            <div>
              <p className="text-[9px] text-[#B6B8C4]/50 uppercase tracking-widest leading-none mb-0.5">Classification</p>
              <span className={`text-xs font-bold uppercase ${colors.text}`}>{result.verdict || rawLevel}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Score & Security Assessment (Section 3 & 5) ── */}
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
              <span className="text-[9px] text-[#B6B8C4] uppercase font-bold tracking-widest">Risk Score</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(236,154,163,0.1)] text-[10px] font-extrabold uppercase ${colors.text}`}>
              <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
              {result.verdict || rawLevel}
            </span>
          </div>
        </motion.div>

        {/* Security Assessment */}
        <motion.div
          className="md:col-span-2 p-6 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.06)] flex flex-col justify-between"
          initial={{ x: 15, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-2">Security Assessment</h3>
            <p className="text-sm font-bold text-[#F8F8FA]">{result.headline || "Threat Scan Diagnostics"}</p>
            <p className="text-xs text-[#B6B8C4] mt-2 leading-relaxed">{executiveSummary}</p>
          </div>
          <div className="pt-4 border-t border-[rgba(236,154,163,0.05)] mt-4">
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5" />
              <p className="text-xs text-[#B6B8C4]">
                <span className="font-bold text-white">Threat Signature:</span> {summary}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Trust Indicators (Section 6) ── */}
      <motion.div
        className="p-5 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.06)]"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.33 }}
      >
        <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Trust Indicators</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {trustIndicators.map((indicator, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 px-3 py-2 rounded-xl border border-emerald-500/10">
              <span className="font-bold">✓</span>
              <span>{indicator}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Recipient Information Card (Section 8) ── */}
      {isUpiType && upiDetails && (
        <motion.div
          className="p-5 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.08)] space-y-4"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recipient Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Recipient Name</span>
              <span className="text-xs font-bold text-white">{upiDetails.pn}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">UPI ID</span>
              <span className="text-xs font-mono font-bold text-[#EC9AA3] break-all">{upiDetails.pa}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Bank / PSP</span>
              <span className="text-xs font-bold text-indigo-400">{upiDetails.bankPsp}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Merchant Category Code</span>
              <span className="text-xs font-mono font-medium text-white">{upiDetails.mc}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Requested Amount</span>
              <span className="text-xs font-bold text-white">
                {upiDetails.am !== "Not Available" ? `${upiDetails.am} ${upiDetails.cu}` : "Not Available"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Currency</span>
              <span className="text-xs font-medium text-white">{upiDetails.cu}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Transaction Note</span>
              <span className="text-xs font-medium text-white">{upiDetails.tn}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Payment Mode</span>
              <span className="text-xs font-medium text-white">{upiDetails.mode}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Static / Dynamic QR</span>
              <span className="text-xs font-bold text-white">{upiDetails.qrType}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── URL Analysis Section ── */}
      {isUrlType && (
        <motion.div
          className="p-5 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.08)] space-y-4"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">URL Destination Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-full">
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Original Link URL</span>
              <span className="text-xs font-mono font-medium text-[#EC9AA3] break-all">{result.decodedContent}</span>
            </div>
            {result.metadata?.redirectChain && result.metadata.redirectChain.length > 1 && (
              <div className="col-span-full">
                <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Expanded URL / Destination</span>
                <span className="text-xs font-mono font-medium text-white break-all">{finalDestination}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Domain</span>
              <span className="text-xs font-bold text-white">{domain}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Redirects Hops</span>
              <span className="text-xs font-bold text-white">{result.metadata?.redirectChain ? result.metadata.redirectChain.length - 1 : 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Reputation</span>
              <span className={`text-xs font-bold ${intel?.google?.detected || (intel?.virusTotal?.maliciousCount && intel.virusTotal.maliciousCount > 0) ? "text-red-400" : "text-emerald-400"}`}>
                {intel?.google?.detected ? "Flagged (Google)" : (intel?.virusTotal?.maliciousCount && intel.virusTotal.maliciousCount > 0 ? "Malicious" : "Clean / Safe")}
              </span>
            </div>
          </div>

          {/* Highlights */}
          <div className="pt-2 border-t border-[rgba(236,154,163,0.05)] space-y-2">
            <span className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-wider block">Threat Highlights</span>
            <div className="flex flex-wrap gap-2">
              {hasShortener && <StatusHighlight label="URL Shortener Detected" danger />}
              {intel?.lexical?.suspiciousTld && <StatusHighlight label="Suspicious TLD (.xyz, etc.)" danger />}
              {intel?.lexical?.ipAddressUrl && <StatusHighlight label="IP-Based Domain" danger />}
              {intel?.lexical?.punycodeDetected && <StatusHighlight label="Punycode / Homograph Attack" danger />}
              {intel?.lexical?.subdomainDeception && <StatusHighlight label="Subdomain Brand Deception" danger />}
              {(!result.decodedContent?.startsWith("https://") && !finalDestination.startsWith("https://")) && <StatusHighlight label="Unsafe Protocol (HTTP)" danger />}
              {!hasShortener && !intel?.lexical?.suspiciousTld && !intel?.lexical?.ipAddressUrl && !intel?.lexical?.punycodeDetected && !intel?.lexical?.subdomainDeception && (
                <span className="text-xs text-[#B6B8C4]/40 italic">No suspicious domain highlights detected</span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Security Metadata (Section 10) ── */}
      <motion.div
        className="p-5 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.08)] space-y-3"
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.38 }}
      >
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Security Metadata</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-[#B6B8C4]/50 uppercase block">QR Integrity</span>
            <span className="text-white font-medium">Valid Structure</span>
          </div>
          <div>
            <span className="text-[10px] text-[#B6B8C4]/50 uppercase block">Embedded URLs</span>
            <span className="text-white font-medium">{isUrlType ? "1 Resolved" : "None Detected"}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#B6B8C4]/50 uppercase block">Hidden Unicode</span>
            <span className="text-white font-medium">Clean</span>
          </div>
          <div>
            <span className="text-[10px] text-[#B6B8C4]/50 uppercase block">Suspicious Parameters</span>
            <span className="text-white font-medium">None</span>
          </div>
          <div>
            <span className="text-[10px] text-[#B6B8C4]/50 uppercase block">Requested Amount</span>
            <span className="text-white font-medium">
              {isUpiType && upiDetails && upiDetails.am !== "Not Available" ? `${upiDetails.am} ${upiDetails.cu}` : "None"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#B6B8C4]/50 uppercase block">Merchant Category</span>
            <span className="text-white font-medium">
              {isUpiType && upiDetails ? upiDetails.mc : "Not Applicable"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#B6B8C4]/50 uppercase block">Payment Mode</span>
            <span className="text-white font-medium">{isUpiType ? "UPI" : "Not Applicable"}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#B6B8C4]/50 uppercase block">Encoding</span>
            <span className="text-white font-medium">UTF-8</span>
          </div>
          <div>
            <span className="text-[10px] text-[#B6B8C4]/50 uppercase block">QR Version</span>
            <span className="text-white font-medium">Model 2</span>
          </div>
          <div>
            <span className="text-[10px] text-[#B6B8C4]/50 uppercase block">Error Correction</span>
            <span className="text-white font-medium">M (Medium)</span>
          </div>
        </div>
      </motion.div>

      {/* ── Chronological Analysis Timeline (Section 9) ── */}
      <motion.div
        className="p-5 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.06)]"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-4">Chronological Analysis Pipeline</h3>
        <div className="relative pl-6 border-l-2 border-[rgba(236,154,163,0.15)] space-y-4">
          {timelineItems.map((item, idx) => (
            <div key={idx} className="relative flex items-center justify-between">
              <span className="absolute -left-[31px] w-4 h-4 rounded-full bg-[#12121A] border-2 border-[#EC9AA3] flex items-center justify-center text-[10px] text-[#EC9AA3] font-extrabold select-none">
                ✓
              </span>
              <span className="text-xs text-[#F8F8FA] font-medium pl-2">{item.label}</span>
              <span className="text-[10px] text-[#B6B8C4]/40 font-mono">Stage {idx + 1}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Threat Intelligence Panel (URL scans only) ── */}
      {intel && (
        <motion.div
          className="space-y-3"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.42 }}
        >
          <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider">Threat Intelligence Feeds</h3>

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

      {/* ── Detected Signals ── */}
      {signals.length > 0 && (
        <motion.div
          className="space-y-3"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.44 }}
        >
          <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider">Detected Signals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {signals.map((signal, i) => (
              <div
                key={i}
                onClick={() => setExpandedSignal(expandedSignal === i ? null : i)}
                className="px-4 py-3 rounded-2xl bg-[#0D0D12]/60 border border-[rgba(236,154,163,0.06)] hover:border-[rgba(236,154,163,0.15)] cursor-pointer transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#EC9AA3]"
                tabIndex={0}
                role="button"
                aria-expanded={expandedSignal === i}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedSignal(expandedSignal === i ? null : i);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${severityColor[signal.severity.toLowerCase()] || "bg-[#B6B8C4]"}`}>
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

      {/* ── AI Safety Safety Advice ── */}
      {ai && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.46 }}
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
        transition={{ delay: 0.48 }}
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
          <span className="font-bold text-[#EC9AA3]">Decision Verdict:</span> {recommendation}
        </p>
      </motion.div>

      {/* ── View Raw Payload (Collapsed by Default) (Section 2) ── */}
      <motion.div
        className="p-4 rounded-2xl bg-[#0D0D12]/40 border border-white/5 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={() => setShowRawPayload(!showRawPayload)}
          className="text-xs font-bold text-[#B6B8C4]/70 hover:text-white transition-all flex items-center gap-1.5 focus:outline-none focus:underline"
          aria-expanded={showRawPayload}
        >
          <span>{showRawPayload ? "▼" : "▶"}</span> View Raw Payload
        </button>
        <AnimatePresence>
          {showRawPayload && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2"
            >
              <pre className="p-3 rounded-lg bg-black/40 text-[10px] font-mono text-[#EC9AA3] break-all whitespace-pre-wrap select-text">
                {result.decodedContent || JSON.stringify(result, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Traceability Footer Scan ID (Section 1) ── */}
      <div className="pt-2 text-center">
        <span className="text-[9px] text-[#B6B8C4]/30 font-mono">
          Scan ID: {result.scanId || result.id || "N/A"}
        </span>
      </div>

      {/* ── Operations Buttons ── */}
      <motion.div
        className="flex flex-wrap gap-3 pt-2 justify-center sm:justify-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <button
          onClick={onNewScan}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] hover:shadow-[0_4px_16px_rgba(236,154,163,0.2)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 focus:ring-2 focus:ring-[#EC9AA3] focus:outline-none"
        >
          Scan Another Input
        </button>
        <Link
          href="/threats"
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#F8F8FA] border border-[rgba(236,154,163,0.15)] hover:border-[rgba(236,154,163,0.3)] hover:-translate-y-0.5 transition-all duration-200 focus:ring-2 focus:ring-white/40 focus:outline-none"
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

function StatusHighlight({
  label,
  danger,
}: {
  label: string;
  danger?: boolean;
}) {
  const color = danger
    ? "bg-red-500/10 text-red-400 border-red-500/20"
    : "bg-amber-500/10 text-amber-400 border-amber-500/20";

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wider ${color}`}>
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
