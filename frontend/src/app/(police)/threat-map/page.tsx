"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
  const [selectedState, setSelected]  = useState<StateData | null>(null);
  const [mode, setMode]               = useState<MapMode>("heatmap");
  const [radarAngle, setRadarAngle]   = useState(0);

  useEffect(() => {
    api<any>("/analytics/threat-map")
      .then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setRadarAngle(a => (a + 1.5) % 360), 50);
    return () => clearInterval(iv);
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
          className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { label: "Total Scans",     value: data.summary.totalScans,           color: "text-[#F8F8FA]" },
            { label: "Reports",         value: data.summary.totalReports,         color: "text-[#F8F8FA]" },
            { label: "Evidence",        value: data.summary.totalEvidence,        color: "text-[#F8F8FA]" },
            { label: "Investigations",  value: data.summary.totalInvestigations,  color: "text-emerald-400" },
            { label: "High Risk",       value: data.summary.highRiskScans,        color: "text-red-400" },
          ].map(s => (
            <div key={s.label}
              className="px-4 py-4 rounded-2xl bg-[#0D0D14]/80 border border-[rgba(236,154,163,0.07)]
                hover:border-[rgba(236,154,163,0.16)] transition-[border-color] duration-200 text-center">
              <p className={`text-2xl font-black tabular-nums ${s.color}`}>
                {(s.value ?? 0).toLocaleString()}
              </p>
              <p className="text-[8px] text-[#B6B8C4]/50 uppercase tracking-[0.1em] mt-2">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Mode switcher */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {(["heatmap","markers","investigations","evidence"] as MapMode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap
              transition-all duration-150
              ${mode === m
                ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]"
                : "text-[#B6B8C4]/60 hover:text-[#F8F8FA] border border-transparent hover:border-[rgba(236,154,163,0.08)]"
              }`}>
            {m === "heatmap" ? "Threat Heatmap"
              : m === "markers" ? "Incident Markers"
              : m === "investigations" ? "Investigation Density"
              : "Evidence Density"}
          </button>
        ))}
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
        className="relative rounded-2xl bg-[#060610] border border-[rgba(236,154,163,0.07)] overflow-hidden"
        style={{ height: 560 }}
      >
        {/* India SVG */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img src="/india.svg" alt="" className="h-[95%] w-auto"
            style={{ filter: "drop-shadow(0 0 20px rgba(236,154,163,0.04)) opacity(0.9)" }} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(236,154,163,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(236,154,163,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

        {/* Radar sweep */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[460px] h-[460px] rounded-full relative overflow-hidden opacity-30">
            <div className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from ${radarAngle}deg, transparent 0deg, rgba(236,154,163,0.1) 20deg, transparent 40deg)`,
              }} />
          </div>
        </div>

        {/* State markers */}
        {data?.states.map(state => {
          const pos = STATE_POSITIONS[state.state];
          if (!pos) return null;
          const color = THREAT_COLOR[state.threatLevel] ?? THREAT_COLOR.low;
          const baseSize = mode === "investigations"
            ? Math.max(6, Math.min(20, state.investigations * 6))
            : Math.max(6, Math.min(22, state.threats * 3));

          return (
            <button key={state.state} onClick={() => setSelected(s => s?.state === state.state ? null : state)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              aria-label={`${state.state}: ${state.threats} threats`}
            >
              {/* Pulse ring */}
              {state.threats > 0 && (
                <span className="absolute rounded-full animate-ping"
                  style={{
                    width: baseSize + 10, height: baseSize + 10,
                    left: -(baseSize + 10) / 2 + baseSize / 2,
                    top: -(baseSize + 10) / 2 + baseSize / 2,
                    backgroundColor: `${color}25`,
                  }} />
              )}
              {/* Marker */}
              <span className="block rounded-full border-2 transition-transform duration-200 group-hover:scale-[1.9]"
                style={{
                  width: baseSize, height: baseSize,
                  backgroundColor: `${color}45`,
                  borderColor: color,
                  boxShadow: `0 0 ${baseSize + 4}px ${color}55`,
                }} />
              {/* Tooltip */}
              <span className="absolute left-1/2 -translate-x-1/2 -top-9 hidden group-hover:block
                whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#0D0D14] text-[9px] text-[#F8F8FA]
                border border-[rgba(236,154,163,0.15)] shadow-xl z-20 pointer-events-none">
                <span className="font-semibold">{state.state}</span>
                <span className="text-[#B6B8C4]/60"> — {state.threats} threats</span>
              </span>
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-2 rounded-xl
          bg-[#0D0D14]/90 border border-[rgba(236,154,163,0.08)] backdrop-blur-md">
          {Object.entries(THREAT_COLOR).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[8px] text-[#B6B8C4]/70 capitalize">{level}</span>
            </div>
          ))}
        </div>

        {/* Live indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl
          bg-[#0D0D14]/90 border border-[rgba(236,154,163,0.08)] backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[9px] text-[#B6B8C4]/70 font-medium">Live</span>
        </div>

        {/* Mode label */}
        <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg
          bg-[#0D0D14]/80 border border-[rgba(236,154,163,0.06)] backdrop-blur-md">
          <span className="text-[9px] text-[#EC9AA3]/70 font-semibold uppercase tracking-wider">
            {mode.replace(/_/g, " ")}
          </span>
        </div>
      </motion.div>

      {/* State detail panel */}
      {selectedState && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="rounded-2xl bg-[#0D0D14]/85 border border-[rgba(236,154,163,0.08)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${THREAT_BG[selectedState.threatLevel]}`} />
              <h3 className="text-sm font-bold text-[#F8F8FA]">{selectedState.state}</h3>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${THREAT_TEXT[selectedState.threatLevel]}`}>
                {selectedState.threatLevel} threat
              </span>
            </div>
            <button onClick={() => setSelected(null)}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                text-[#B6B8C4]/50 hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.07)]
                transition-colors text-sm">
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Threats",   value: selectedState.threats,       color: "text-[#F8F8FA]" },
              { label: "Reports",         value: selectedState.reports,       color: "text-[#EC9AA3]" },
              { label: "Critical",        value: selectedState.critical,      color: "text-red-400" },
              { label: "Investigations",  value: selectedState.investigations, color: "text-amber-400" },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-[#B6B8C4]/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

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
