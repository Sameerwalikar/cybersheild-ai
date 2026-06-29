"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const scanTypes = [
  { id: "message", title: "Scan Message", description: "Analyze SMS, WhatsApp, or email messages for phishing and scam indicators.", href: "/scan/message", icon: <MessageIcon /> },
  { id: "website", title: "Scan Website", description: "Check URLs for malicious content, phishing pages, or unsafe redirects.", href: "/scan/website", icon: <GlobeIcon /> },
  { id: "qr", title: "Scan QR Code", description: "Decode and analyze QR codes for malicious URLs or payment fraud.", href: "/scan/qr", icon: <QrIcon /> },
  { id: "upi", title: "Scan UPI", description: "Verify UPI IDs against known fraud databases and pattern analysis.", href: "/scan/upi", icon: <UpiIcon /> },
  { id: "voice", title: "Voice Analysis", description: "Analyze recorded phone calls for social engineering and vishing patterns.", href: "/scan/voice", icon: <MicIcon /> },
  { id: "report", title: "Report Scam", description: "Submit a scam or fraud report to authorities and community database.", href: "/scan/report", icon: <AlertIcon /> },
];

export default function ScannerHub() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-[#F8F8FA]">What would you like to scan today?</h1>
        <p className="mt-2 text-sm text-[#B6B8C4]">Choose a scan type to begin protecting yourself from cyber threats.</p>
      </motion.div>

      {/* Scan type cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {scanTypes.map((type) => (
          <motion.div
            key={type.id}
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }}
          >
            <Link
              href={type.href}
              className="block p-5 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] hover:border-[rgba(236,154,163,0.2)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#12121A] border border-[rgba(236,154,163,0.1)] flex items-center justify-center mb-4 text-[#EC9AA3]/60 group-hover:text-[#EC9AA3] group-hover:bg-[rgba(236,154,163,0.06)] group-hover:scale-110 transition-all duration-200">
                {type.icon}
              </div>
              <h3 className="text-sm font-semibold text-[#F8F8FA] mb-1">{type.title}</h3>
              <p className="text-[11px] text-[#B6B8C4] leading-relaxed">{type.description}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function MessageIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function GlobeIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function QrIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><path d="M14 14h3v3h-3zM20 14v3h-3M14 20h3M20 20h0"/></svg>; }
function UpiIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function MicIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>; }
function AlertIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>; }
