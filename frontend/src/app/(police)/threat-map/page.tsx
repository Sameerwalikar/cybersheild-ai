"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
function getToken() { if (typeof window === "undefined") return null; return localStorage.getItem("accessToken"); }
async function api<T>(endpoint: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed");
  return json.data as T;
}

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const threatColors: Record<string, string> = { low: "#34d399", medium: "#fbbf24", high: "#fb923c", critical: "#f87171" };
const threatBg: Record<string, string> = { low: "bg-emerald-400", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };

// State positions mapped to the India SVG viewBox (600x700) — converted to percentages
// These are tuned to land on actual state centers within the SVG outline
const statePositions: Record<string, { x: number; y: number }> = {
  "Jammu and Kashmir": { x: 42, y: 8 },
  "Himachal Pradesh": { x: 46, y: 14 },
  "Punjab": { x: 40, y: 17 },
  "Uttarakhand": { x: 50, y: 17 },
  "Haryana": { x: 43, y: 21 },
  "Delhi": { x: 45, y: 23 },
  "Rajasthan": { x: 34, y: 30 },
  "Uttar Pradesh": { x: 52, y: 28 },
  "Bihar": { x: 62, y: 30 },
  "Sikkim": { x: 67, y: 26 },
  "Arunachal Pradesh": { x: 78, y: 22 },
  "Nagaland": { x: 80, y: 27 },
  "Manipur": { x: 79, y: 30 },
  "Mizoram": { x: 77, y: 34 },
  "Tripura": { x: 74, y: 33 },
  "Meghalaya": { x: 73, y: 28 },
  "Assam": { x: 75, y: 26 },
  "West Bengal": { x: 64, y: 37 },
  "Jharkhand": { x: 60, y: 35 },
  "Odisha": { x: 58, y: 42 },
  "Chhattisgarh": { x: 52, y: 40 },
  "Madhya Pradesh": { x: 44, y: 37 },
  "Gujarat": { x: 30, y: 40 },
  "Maharashtra": { x: 38, y: 50 },
  "Telangana": { x: 46, y: 54 },
  "Andhra Pradesh": { x: 48, y: 60 },
  "Karnataka": { x: 38, y: 62 },
  "Goa": { x: 32, y: 58 },
  "Kerala": { x: 36, y: 74 },
  "Tamil Nadu": { x: 44, y: 72 },
};

type MapMode = "heatmap" | "markers" | "investigations" | "evidence";

interface StateData {
  state: string;
  threats: number;
  reports: number;
  critical: number;
  investigations: number;
  threatLevel: string;
}

export default function ThreatMapPage() {
  const [data, setData] = useState<{ states: StateData[]; summary: any; recentActivity: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [mode, setMode] = useState<MapMode>("heatmap");
  const [radarAngle, setRadarAngle] = useState(0);

  useEffect(() => {
    api<any>("/analytics/threat-map")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Radar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle((a) => (a + 1.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  if (error) return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-400">{error}</p></div>;
  if (loading) return <div className="h-[600px] rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse" />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">National Cyber Threat Map</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Live intelligence overview across India.</p>
      </motion.div>

      {/* Summary stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="Total Scans" value={data.summary.totalScans} />
          <Stat label="Reports" value={data.summary.totalReports} />
          <Stat label="Evidence" value={data.summary.totalEvidence} />
          <Stat label="Investigations" value={data.summary.totalInvestigations} />
          <Stat label="High Risk" value={data.summary.highRiskScans} color="text-red-400" />
        </div>
      )}

      {/* Mode switcher */}
      <div className="flex gap-2">
        {(["heatmap", "markers", "investigations", "evidence"] as MapMode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-all ${mode === m ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]" : "text-[#B6B8C4] hover:text-[#F8F8FA]"}`}>
            {m === "heatmap" ? "Threat Heatmap" : m === "markers" ? "Incident Markers" : m === "investigations" ? "Investigation Density" : "Evidence Density"}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl bg-[#080810] border border-[rgba(236,154,163,0.08)] overflow-hidden" style={{ height: 560 }}>
        {/* India SVG background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/india.svg"
            alt=""
            className="h-[95%] w-auto opacity-100"
            style={{ filter: "drop-shadow(0 0 20px rgba(236,154,163,0.05))" }}
          />
        </div>

        {/* Radar sweep centered on map */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[460px] h-[460px] rounded-full relative overflow-hidden" style={{ opacity: 0.4 }}>
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from ${radarAngle}deg, transparent 0deg, rgba(236,154,163,0.12) 20deg, transparent 40deg)` }} />
          </div>
        </div>

        {/* State markers */}
        {data?.states.map((state) => {
          const pos = statePositions[state.state];
          if (!pos) return null;
          const color = threatColors[state.threatLevel] || threatColors.low;
          const size = mode === "investigations" ? Math.max(6, Math.min(20, state.investigations * 6)) :
                       mode === "evidence" ? Math.max(6, Math.min(20, state.threats * 3)) :
                       Math.max(6, Math.min(22, state.threats * 3));

          return (
            <button
              key={state.state}
              onClick={() => setSelectedState(state)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {/* Outer glow pulse for active threats */}
              {state.threats > 0 && (
                <span className="absolute rounded-full animate-ping" style={{ width: size + 8, height: size + 8, left: -(size + 8) / 2 + size / 2, top: -(size + 8) / 2 + size / 2, backgroundColor: `${color}30` }} />
              )}
              {/* Main marker */}
              <span
                className="block rounded-full border-2 transition-transform duration-200 group-hover:scale-[1.8]"
                style={{ width: size, height: size, backgroundColor: `${color}50`, borderColor: color, boxShadow: `0 0 ${size + 4}px ${color}60` }}
              />
              {/* Tooltip */}
              <span className="absolute left-1/2 -translate-x-1/2 -top-7 hidden group-hover:block whitespace-nowrap px-2 py-1 rounded-md bg-[#1a1a24] text-[9px] text-[#F8F8FA] border border-[rgba(236,154,163,0.15)] shadow-lg z-20">
                {state.state} — {state.threats} threats
              </span>
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0D0D12]/90 border border-[rgba(236,154,163,0.08)] backdrop-blur-sm">
          {Object.entries(threatColors).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[8px] text-[#B6B8C4] capitalize">{level}</span>
            </div>
          ))}
        </div>

        {/* Live indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0D0D12]/90 border border-[rgba(236,154,163,0.08)] backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-[#B6B8C4]">Live</span>
        </div>
      </div>

      {/* State detail panel */}
      {selectedState && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${threatBg[selectedState.threatLevel]}`} />
              <h3 className="text-sm font-bold text-[#F8F8FA]">{selectedState.state}</h3>
              <span className="text-[9px] text-[#B6B8C4] uppercase capitalize">{selectedState.threatLevel} threat</span>
            </div>
            <button onClick={() => setSelectedState(null)} className="text-[#B6B8C4] hover:text-[#F8F8FA] text-lg">×</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><p className="text-lg font-bold text-[#F8F8FA] tabular-nums">{selectedState.threats}</p><p className="text-[9px] text-[#B6B8C4]">Total Threats</p></div>
            <div><p className="text-lg font-bold text-[#EC9AA3] tabular-nums">{selectedState.reports}</p><p className="text-[9px] text-[#B6B8C4]">Reports</p></div>
            <div><p className="text-lg font-bold text-red-400 tabular-nums">{selectedState.critical}</p><p className="text-[9px] text-[#B6B8C4]">Critical</p></div>
            <div><p className="text-lg font-bold text-amber-400 tabular-nums">{selectedState.investigations}</p><p className="text-[9px] text-[#B6B8C4]">Investigations</p></div>
          </div>
        </motion.div>
      )}

      {/* Recent activity feed */}
      {data && data.recentActivity.length > 0 && (
        <div className="rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] p-4">
          <h3 className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider mb-3">Live Activity Feed</h3>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {data.recentActivity.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#12121A]/30">
                <span className="text-[10px] text-[#F8F8FA]">{a.type}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${a.priority === "critical" ? "bg-red-500/20 text-red-400" : a.priority === "high" ? "bg-orange-500/20 text-orange-400" : "bg-amber-500/20 text-amber-400"}`}>{a.priority}</span>
                  <span className="text-[8px] text-[#B6B8C4]/50">{new Date(a.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = "text-[#F8F8FA]" }: { label: string; value: number; color?: string }) {
  return <div className="px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] text-center"><p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p><p className="text-[9px] text-[#B6B8C4] uppercase mt-0.5">{label}</p></div>;
}
