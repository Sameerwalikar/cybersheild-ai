"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Shield, AlertTriangle, FileText, Activity, ShieldAlert } from "lucide-react";

const InfrastructureMap = dynamic(() => import("../../../components/maps/InfrastructureMap"), { ssr: false });

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
function getToken() { if (typeof window === "undefined") return null; return localStorage.getItem("accessToken"); }
async function api<T>(endpoint: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed");
  return json.data as T;
}

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const THREAT_COLOR: Record<string, string> = {
  low: "#34d399", medium: "#fbbf24", high: "#fb923c", critical: "#f87171",
};
const THREAT_BG: Record<string, string> = {
  low: "bg-emerald-400", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400",
};
const THREAT_TEXT: Record<string, string> = {
  low: "text-emerald-400", medium: "text-amber-400", high: "text-orange-400", critical: "text-red-400",
};

const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  "Jammu and Kashmir": { x: 42, y: 8 }, "Himachal Pradesh": { x: 46, y: 14 },
  "Punjab": { x: 40, y: 17 }, "Uttarakhand": { x: 50, y: 17 },
  "Haryana": { x: 43, y: 21 }, "Delhi": { x: 45, y: 23 },
  "Rajasthan": { x: 34, y: 30 }, "Uttar Pradesh": { x: 52, y: 28 },
  "Bihar": { x: 62, y: 30 }, "Sikkim": { x: 67, y: 26 },
  "Arunachal Pradesh": { x: 78, y: 22 }, "Nagaland": { x: 80, y: 27 },
  "Manipur": { x: 79, y: 30 }, "Mizoram": { x: 77, y: 34 },
  "Tripura": { x: 74, y: 33 }, "Meghalaya": { x: 73, y: 28 },
  "Assam": { x: 75, y: 26 }, "West Bengal": { x: 64, y: 37 },
  "Jharkhand": { x: 60, y: 35 }, "Odisha": { x: 58, y: 42 },
  "Chhattisgarh": { x: 52, y: 40 }, "Madhya Pradesh": { x: 44, y: 37 },
  "Gujarat": { x: 30, y: 40 }, "Maharashtra": { x: 38, y: 50 },
  "Telangana": { x: 46, y: 54 }, "Andhra Pradesh": { x: 48, y: 60 },
  "Karnataka": { x: 38, y: 62 }, "Goa": { x: 32, y: 58 },
  "Kerala": { x: 36, y: 74 }, "Tamil Nadu": { x: 44, y: 72 },
};

type MapMode = "heatmap" | "markers" | "investigations" | "evidence";

interface StateData {
  state: string; threats: number; reports: number;
  critical: number; investigations: number; threatLevel: string;
}

export default function ThreatMapPage() {
  const [data, setData] = useState<{ states: StateData[]; summary: any; recentActivity: any[] } | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [filter, setFilter]           = useState("all");

  useEffect(() => {
    api<any>("/analytics/threat-map")
      .then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api<any>("/analytics/threat-map")
      .then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-red-400">{error}</p>
    </div>
  );
  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-72 rounded-xl bg-[rgba(236,154,163,0.07)]" />
      <div className="grid grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[72px] rounded-2xl bg-[rgba(236,154,163,0.04)]" />)}
      </div>
      <div className="h-[560px] rounded-2xl bg-[rgba(236,154,163,0.03)]" />
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight">
          National Cyber Threat Map
        </h1>
        <p className="mt-1 text-xs text-[#B6B8C4]/55 font-medium">
          Live intelligence overview across all Indian states.
        </p>
      </motion.div>

      {/* Summary stats */}
      {data && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Scans",     value: data.summary.totalScans,           icon: <Activity size={18} />,     color: "text-[#F8F8FA]", bg: "from-white/5 to-transparent", borderColor: "border-white/10" },
            { label: "Reports",         value: data.summary.totalReports,         icon: <FileText size={18} />,     color: "text-[#F8F8FA]", bg: "from-white/5 to-transparent", borderColor: "border-white/10" },
            { label: "Evidence",        value: data.summary.totalEvidence,        icon: <Shield size={18} />,       color: "text-[#F8F8FA]", bg: "from-white/5 to-transparent", borderColor: "border-white/10" },
            { label: "Investigations",  value: data.summary.totalInvestigations,  icon: <ShieldAlert size={18} />,  color: "text-emerald-400", bg: "from-emerald-500/5 to-transparent", borderColor: "border-emerald-500/20" },
            { label: "High Risk",       value: data.summary.highRiskScans,        icon: <AlertTriangle size={18} />,color: "text-red-400", bg: "from-red-500/5 to-transparent", borderColor: "border-red-500/20" },
          ].map(s => (
            <div key={s.label}
              className={`relative px-4 py-5 rounded-2xl bg-gradient-to-b ${s.bg} border ${s.borderColor} 
                backdrop-blur-xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 group`}>
              <div className={`absolute top-4 right-4 opacity-20 ${s.color} group-hover:opacity-40 transition-opacity`}>
                {s.icon}
              </div>
              <p className={`text-3xl font-black tabular-nums tracking-tight ${s.color}`}>
                {(s.value ?? 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-[#B6B8C4]/60 uppercase tracking-[0.15em] mt-2 font-bold flex items-center gap-1.5">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Mode switcher */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {(["all", "high", "critical"]).map(m => (
          <button key={m} onClick={() => setFilter(m)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap
              transition-all duration-200 uppercase tracking-wider
              ${filter === m
                ? "bg-[rgba(236,154,163,0.15)] text-[#EC9AA3] border border-[rgba(236,154,163,0.3)] shadow-[0_0_15px_rgba(236,154,163,0.1)]"
                : "text-[#B6B8C4]/50 hover:text-[#F8F8FA] bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10"
              }`}>
            {m === "all" ? "All Infrastructure"
              : m === "high" ? "High & Critical Risk"
              : "Critical Threats Only"}
          </button>
        ))}
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
        className="relative rounded-2xl bg-[#060610] border border-[rgba(236,154,163,0.15)] overflow-hidden shadow-2xl shadow-[rgba(236,154,163,0.05)]"
        style={{ height: 560 }}
      >
        <InfrastructureMap filter={filter} />

        {/* Live indicator overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl
          bg-[#0D0D14]/90 border border-emerald-500/20 backdrop-blur-md z-[1000] shadow-[0_0_15px_rgba(52,211,153,0.1)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Live Feed</span>
        </div>

        {/* Mode label */}
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl
          bg-[#0D0D14]/80 border border-[rgba(236,154,163,0.1)] backdrop-blur-md z-[1000]">
          <span className="text-[10px] text-[#EC9AA3]/90 font-bold uppercase tracking-wider">
            {filter === "all" ? "GLOBAL INFRASTRUCTURE" : filter === "high" ? "HIGH RISK INFRASTRUCTURE" : "CRITICAL THREATS"}
          </span>
        </div>
      </motion.div>



      {/* Recent activity */}
      {data && data.recentActivity.length > 0 && (
        <div className="rounded-2xl bg-[#0D0D14]/85 border border-[rgba(236,154,163,0.07)] p-4">
          <h3 className="text-[10px] font-bold text-[#B6B8C4]/80 uppercase tracking-[0.08em] mb-3">
            Live Activity Feed
          </h3>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
            {data.recentActivity.map((a: any, i: number) => (
              <div key={i}
                className="flex items-center justify-between px-3 py-2 rounded-xl
                  bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                  hover:border-[rgba(236,154,163,0.1)] transition-colors">
                <span className="text-[10px] text-[#F8F8FA]">{a.type}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md
                    ${a.priority === "critical" ? "bg-red-500/20 text-red-400"
                    : a.priority === "high"     ? "bg-orange-500/20 text-orange-400"
                    :                             "bg-amber-500/20 text-amber-400"}`}>
                    {a.priority}
                  </span>
                  <span className="text-[8px] text-[#B6B8C4]/35 font-mono">
                    {new Date(a.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
