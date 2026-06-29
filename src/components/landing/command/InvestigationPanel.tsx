"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CityInvestigation {
  caseId: string;
  threatType: string;
  phones: number;
  upiIds: number;
  domains: number;
  devices: number;
  complaints: number;
  confidence: number;
  status: string;
}

const investigations: Record<string, CityInvestigation> = {
  Delhi: { caseId: "CYB-DEL-2026-047", threatType: "UPI Fraud Network", phones: 18, upiIds: 12, domains: 4, devices: 9, complaints: 31, confidence: 94, status: "Active" },
  Mumbai: { caseId: "CYB-MUM-2026-063", threatType: "Banking Domain Ring", phones: 24, upiIds: 8, domains: 11, devices: 15, complaints: 47, confidence: 97, status: "Critical" },
  Bengaluru: { caseId: "CYB-BLR-2026-038", threatType: "Investment Scam Cell", phones: 9, upiIds: 6, domains: 7, devices: 5, complaints: 22, confidence: 91, status: "Active" },
  Hyderabad: { caseId: "CYB-HYD-2026-029", threatType: "Deepfake Voice Ring", phones: 11, upiIds: 3, domains: 2, devices: 8, complaints: 15, confidence: 88, status: "Monitoring" },
  Chennai: { caseId: "CYB-CHN-2026-022", threatType: "Phishing Campaign", phones: 7, upiIds: 5, domains: 9, devices: 4, complaints: 18, confidence: 92, status: "Active" },
  Pune: { caseId: "CYB-PUN-2026-031", threatType: "Identity Theft Network", phones: 14, upiIds: 7, domains: 5, devices: 11, complaints: 26, confidence: 93, status: "Active" },
  Kolkata: { caseId: "CYB-KOL-2026-025", threatType: "Fake Domain Syndicate", phones: 8, upiIds: 4, domains: 13, devices: 6, complaints: 19, confidence: 89, status: "Monitoring" },
  Ahmedabad: { caseId: "CYB-AMD-2026-019", threatType: "SIM Swap Network", phones: 21, upiIds: 9, domains: 3, devices: 12, complaints: 14, confidence: 86, status: "Active" },
  Lucknow: { caseId: "CYB-LKO-2026-016", threatType: "Fake Banking Portal", phones: 6, upiIds: 4, domains: 8, devices: 3, complaints: 11, confidence: 84, status: "Monitoring" },
  Jaipur: { caseId: "CYB-JAI-2026-021", threatType: "Voice Scam Operation", phones: 10, upiIds: 5, domains: 2, devices: 7, complaints: 16, confidence: 87, status: "Active" },
};

const defaultInvestigation: CityInvestigation = {
  caseId: "CYB-NAT-2026-001",
  threatType: "Multi-State Fraud Network",
  phones: 142,
  upiIds: 67,
  domains: 58,
  devices: 89,
  complaints: 234,
  confidence: 96,
  status: "Active",
};

interface InvestigationPanelProps {
  active: boolean;
  activeCity?: string | null;
}

export function InvestigationPanel({ active, activeCity }: InvestigationPanelProps) {
  const data = useMemo(() => {
    if (activeCity && investigations[activeCity]) {
      return investigations[activeCity];
    }
    return defaultInvestigation;
  }, [activeCity]);

  const entities = useMemo(() => [
    { label: "Phone Numbers", value: data.phones, status: "connected" },
    { label: "UPI IDs", value: data.upiIds, status: "traced" },
    { label: "Domains", value: data.domains, status: "flagged" },
    { label: "Devices", value: data.devices, status: "identified" },
    { label: "Complaints", value: data.complaints, status: "linked" },
  ], [data]);

  const statusColor = data.status === "Critical" ? "text-red-400" : data.status === "Active" ? "text-emerald-400" : "text-amber-400";

  return (
    <div className="h-full flex flex-col space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]" />
        <span className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider">
          Investigation
        </span>
      </div>

      {/* Case header */}
      <AnimatePresence mode="wait">
        <motion.div
          key={data.caseId}
          className="px-3 py-2.5 rounded-lg bg-[#12121A]/80 border border-[rgba(236,154,163,0.1)]"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono text-[#EC9AA3]">{data.caseId}</span>
            <span className={`text-[8px] font-bold uppercase ${statusColor}`}>{data.status}</span>
          </div>
          <p className="text-[10px] text-[#F8F8FA] font-medium">{data.threatType}</p>
          {activeCity && (
            <p className="text-[8px] text-[#B6B8C4] mt-0.5">{activeCity} Investigation</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Confidence */}
      <div className="px-3 py-2 rounded-lg bg-[#12121A]/80 border border-[rgba(236,154,163,0.08)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-[#B6B8C4]">Confidence</span>
          <span className="text-[10px] font-bold text-[#EC9AA3] tabular-nums">{data.confidence}%</span>
        </div>
        <div className="h-1 rounded-full bg-[#1a1a2e] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA]"
            initial={{ width: "0%" }}
            animate={active ? { width: `${data.confidence}%` } : { width: "0%" }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      </div>

      {/* Entities */}
      <div className="flex-1 space-y-1.5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={data.caseId + "-entities"}
            className="space-y-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {entities.map((entity, i) => (
              <motion.div
                key={entity.label}
                className="px-3 py-1.5 rounded-md bg-[#12121A]/60 border border-[rgba(236,154,163,0.06)] flex items-center justify-between"
                initial={{ opacity: 0, y: 6 }}
                animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-[#EC9AA3]/50" />
                  <span className="text-[10px] text-[#B6B8C4]">{entity.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#F8F8FA] tabular-nums">{entity.value}</span>
                  <span className="text-[7px] text-emerald-400 uppercase">{entity.status}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
