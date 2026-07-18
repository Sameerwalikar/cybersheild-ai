"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { policeApi } from "@/services/api/police";

const IpMap = dynamic(() => import("@/components/ip-tracking/IpMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-xl border border-[rgba(236,154,163,0.14)] bg-[#050508]/60 flex items-center justify-center">
      <span className="text-xs text-[#B6B8C4]/40 font-mono animate-pulse">Initializing Vector Map...</span>
    </div>
  ),
});

interface IPEntity {
  ip: string;
  asn?: {
    number: number;
    org: string;
    type: string;
  };
  geo?: {
    country: string;
    city: string;
    lat: number;
    lon: number;
    accuracy_km: number;
  };
  network_flags?: {
    is_hosting?: boolean;
    is_vpn?: boolean;
    is_proxy?: boolean;
    is_tor?: boolean;
  };
  reputation?: {
    abuseipdb_score?: number;
    abuseipdb_reports?: number;
    greynoise_classification?: string;
  };
  internal?: {
    cybershield_report_count: number;
    first_seen: string;
    last_seen: string;
  };
  network_ownership?: {
    cidr?: string;
    abuse_contact?: string;
    allocation_date?: string;
    registration_country?: string;
  };
  risk_score?: number;
  score_breakdown?: {
    indicator: string;
    points: number;
    category: string;
  }[];
  confidence?: "high" | "medium" | "low";
  source_status?: Record<string, { status: string; latency_ms: number; error?: string }>;
}

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

export default function IpTracingPage() {
  const [ipInput, setIpInput] = useState("");
  const [profile, setProfile] = useState<IPEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotas, setQuotas] = useState<any>(null);

  // Allow/Blocklist states
  const [listType, setListType] = useState<"blocklist" | "allowlist">("blocklist");
  const [listNote, setListNote] = useState("");
  const [listSuccess, setListSuccess] = useState<string | null>(null);

  useEffect(() => {
    policeApi.getIpQuotas()
      .then(setQuotas)
      .catch((err) => console.error("Failed to load quotas:", err.message));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim()) return;

    setLoading(true);
    setError(null);
    setProfile(null);
    setListSuccess(null);

    try {
      const data = await policeApi.getIpRiskProfile(ipInput.trim());
      setProfile(data);
      
      // Update quotas in case quota changed
      const updatedQuotas = await policeApi.getIpQuotas().catch(() => null);
      if (updatedQuotas) setQuotas(updatedQuotas);
    } catch (err: any) {
      setError(err.message || "Failed to query IP profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async () => {
    if (!profile) return;
    try {
      await policeApi.addIpToList(profile.ip, listType, listNote);
      setListSuccess(`Successfully added IP to ${listType}`);
      setListNote("");
    } catch (err: any) {
      setError(err.message || "Failed to add IP to list");
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 25) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score < 50) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    if (score < 75) return "text-orange-400 border-orange-500/30 bg-orange-500/10";
    return "text-red-400 border-red-500/30 bg-red-500/10";
  };

  const getScoreBarColor = (score: number) => {
    if (score < 25) return "bg-emerald-400 shadow-[0_0_12px_#34d399]";
    if (score < 50) return "bg-amber-400 shadow-[0_0_12px_#fbbf24]";
    if (score < 75) return "bg-orange-400 shadow-[0_0_12px_#fb923c]";
    return "bg-red-400 shadow-[0_0_12px_#f87171]";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight">
          IP Forensics & Tracing
        </h1>
        <p className="mt-1.5 text-xs text-[#B6B8C4]/55 font-medium">
          Consolidate reputation metrics, geolocate routers, and log threat networks.
        </p>
      </motion.div>

      {/* ── SEARCH INPUT ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
        className="p-5 rounded-2xl border border-[rgba(236,154,163,0.14)] bg-[#08080F]/50 backdrop-blur-xl"
      >
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            placeholder="Enter target IP address (e.g. 8.8.8.8)..."
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-[#F8F8FA] bg-[#050508]/60 border border-[rgba(236,154,163,0.1)] focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl text-xs font-bold text-[#050508] bg-[#EC9AA3] hover:bg-[#f3b3ba] active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {loading ? "Tracing..." : "Scan Address"}
          </button>
        </form>

        {quotas && (
          <div className="mt-4 flex items-center justify-between text-[10px] text-[#B6B8C4]/40 font-mono">
            <span>AbuseIPDB Api Quotas: {quotas.abuseIPDB?.remaining} checks left of {quotas.abuseIPDB?.limit}</span>
            <span>Local Cache Active</span>
          </div>
        )}
      </motion.div>

      {/* ── ERROR VIEW ────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-medium text-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TRACING PROFILE RESULTS ───────────────────────────────── */}
      <AnimatePresence>
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* LEFT / CENTER DETAIL COLUMN (Geo, ASN, Ownership) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Geolocation Card */}
              <div className="p-5 rounded-2xl border border-[rgba(236,154,163,0.14)] bg-[#08080F]/50 backdrop-blur-xl space-y-4">
                <h2 className="text-sm font-black text-[#F8F8FA] uppercase tracking-wider border-b border-[rgba(236,154,163,0.06)] pb-2.5">
                  🗺️ Geolocation & Routing
                </h2>
                {profile.geo ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[#B6B8C4]/40 block uppercase tracking-wider font-semibold text-[10px]">Location</span>
                        <span className="text-[#F8F8FA] font-bold text-sm">
                          {profile.geo.city}, {profile.geo.country}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[#B6B8C4]/40 block uppercase tracking-wider font-semibold text-[10px]">Coordinates</span>
                        <span className="text-[#F8F8FA] font-mono text-sm">
                          {profile.geo.lat.toFixed(4)}, {profile.geo.lon.toFixed(4)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[#B6B8C4]/40 block uppercase tracking-wider font-semibold text-[10px]">ASN Organization</span>
                        <span className="text-[#F8F8FA] font-bold text-sm">
                          {profile.asn?.org || "Unknown"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[#B6B8C4]/40 block uppercase tracking-wider font-semibold text-[10px]">ASN Number</span>
                        <span className="text-[#F8F8FA] font-mono text-sm">
                          AS{profile.asn?.number || "Unknown"}
                        </span>
                      </div>
                    </div>
                    {typeof profile.geo.lat === "number" && typeof profile.geo.lon === "number" && (
                      <div className="mt-4">
                        <IpMap
                          lat={profile.geo.lat}
                          lon={profile.geo.lon}
                          city={profile.geo.city}
                          country={profile.geo.country}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-[#B6B8C4]/40 italic">No geolocation logs resolved</p>
                )}
              </div>

              {/* Registry Ownership Card */}
              <div className="p-5 rounded-2xl border border-[rgba(236,154,163,0.14)] bg-[#08080F]/50 backdrop-blur-xl space-y-4">
                <h2 className="text-sm font-black text-[#F8F8FA] uppercase tracking-wider border-b border-[rgba(236,154,163,0.06)] pb-2.5">
                  🏢 Network ownership & registrar (RDAP)
                </h2>
                {profile.network_ownership ? (
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[#B6B8C4]/40 block uppercase tracking-wider font-semibold text-[10px]">IP Range (CIDR)</span>
                      <span className="text-[#F8F8FA] font-bold">{profile.network_ownership.cidr}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[#B6B8C4]/40 block uppercase tracking-wider font-semibold text-[10px]">Abuse Contact E-mail</span>
                      <span className="text-[#F8F8FA] font-bold">{profile.network_ownership.abuse_contact}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[#B6B8C4]/40 block uppercase tracking-wider font-semibold text-[10px]">Registration Country</span>
                      <span className="text-[#F8F8FA] font-bold">{profile.network_ownership.registration_country}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[#B6B8C4]/40 block uppercase tracking-wider font-semibold text-[10px]">Allocation Date</span>
                      <span className="text-[#F8F8FA] font-bold">
                        {profile.network_ownership.allocation_date ? new Date(profile.network_ownership.allocation_date).toLocaleDateString() : "Unknown"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#B6B8C4]/40 italic">Failed to resolve network registry</p>
                )}
              </div>

              {/* Audit Log / List Action Card */}
              <div className="p-5 rounded-2xl border border-[rgba(236,154,163,0.14)] bg-[#08080F]/50 backdrop-blur-xl space-y-4">
                <h2 className="text-sm font-black text-[#F8F8FA] uppercase tracking-wider border-b border-[rgba(236,154,163,0.06)] pb-2.5">
                  👮 Security Listings & Actions
                </h2>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-[#B6B8C4]/40 uppercase block mb-1">List Classification</label>
                      <select
                        value={listType}
                        onChange={(e: any) => setListType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-[#F8F8FA] bg-[#050508]/60 border border-[rgba(236,154,163,0.1)] focus:outline-none"
                      >
                        <option value="blocklist">Blocklist (Force block in Aegis)</option>
                        <option value="allowlist">Allowlist (Exempt from flags)</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-[#B6B8C4]/40 uppercase block mb-1">Notes</label>
                      <input
                        type="text"
                        placeholder="Add investigation logs context..."
                        value={listNote}
                        onChange={(e) => setListNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-[#F8F8FA] bg-[#050508]/60 border border-[rgba(236,154,163,0.1)] focus:outline-none focus:border-[rgba(236,154,163,0.3)]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddToList}
                    className="w-full py-2 rounded-lg text-xs font-bold text-[#F8F8FA] bg-red-500/20 border border-red-500/35 hover:bg-red-500/30 transition-all"
                  >
                    Lock Listing Selection
                  </button>
                  {listSuccess && (
                    <p className="text-[11px] text-emerald-400 text-center font-medium mt-1">{listSuccess}</p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR (Threat Score, Flags & Sources) */}
            <div className="space-y-6">
              {/* Score card */}
              <div className="p-5 rounded-2xl border border-[rgba(236,154,163,0.14)] bg-[#08080F]/50 backdrop-blur-xl flex flex-col items-center justify-center space-y-4">
                <span className="text-[10px] font-bold text-[#B6B8C4]/40 uppercase tracking-widest block text-center">Threat Risk score</span>
                
                {/* Radial Gauge Visual */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="64" stroke="rgba(255,255,255,0.02)" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      stroke={profile.risk_score ? (profile.risk_score < 25 ? "#34d399" : profile.risk_score < 50 ? "#fbbf24" : profile.risk_score < 75 ? "#fb923c" : "#f87171") : "rgba(255,255,255,0.1)"}
                      strokeWidth="10"
                      strokeDasharray={402}
                      strokeDashoffset={402 - (402 * (profile.risk_score || 0)) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-black text-[#F8F8FA]">{profile.risk_score ?? 0}</span>
                    <span className="text-[10px] text-[#B6B8C4]/40 block font-semibold uppercase">Confidence: {profile.confidence}</span>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getScoreColor(profile.risk_score || 0)}`}>
                  {profile.risk_score && profile.risk_score >= 75 ? "CRITICAL THREAT" : profile.risk_score && profile.risk_score >= 50 ? "MEDIUM SUSPICION" : "SAFE / CLEAR"}
                </div>
              </div>

              {/* Flags list */}
              <div className="p-5 rounded-2xl border border-[rgba(236,154,163,0.14)] bg-[#08080F]/50 backdrop-blur-xl space-y-4">
                <h3 className="text-xs font-black text-[#F8F8FA] uppercase tracking-wider border-b border-[rgba(236,154,163,0.06)] pb-2">
                  🚩 Risk Indicators
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B6B8C4]/60">Tor exit router</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${profile.network_flags?.is_tor ? "bg-red-500/20 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {profile.network_flags?.is_tor ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B6B8C4]/60">Known VPN node</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${profile.network_flags?.is_vpn ? "bg-red-500/20 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {profile.network_flags?.is_vpn ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B6B8C4]/60">Proxy node</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${profile.network_flags?.is_proxy ? "bg-red-500/20 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {profile.network_flags?.is_proxy ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B6B8C4]/60">Hosting server</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${profile.network_flags?.is_hosting ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {profile.network_flags?.is_hosting ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B6B8C4]/60">Internal reports</span>
                    <span className="text-[#F8F8FA] font-bold font-mono">
                      {profile.internal?.cybershield_report_count || 0}
                    </span>
                  </div>
                </div>

                {profile.score_breakdown && profile.score_breakdown.length > 0 && (
                  <div className="pt-3 border-t border-[rgba(236,154,163,0.06)] space-y-2">
                    <span className="text-[10px] font-bold text-[#B6B8C4]/40 uppercase tracking-wider block">Penalty Breakdown</span>
                    {profile.score_breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] font-medium leading-tight">
                        <span className="text-[#B6B8C4]/60 flex-1 pr-2">{item.indicator}</span>
                        <span className={`font-mono font-bold ${item.points > 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {item.points > 0 ? `+${item.points}` : item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Latency sources check */}
              <div className="p-5 rounded-2xl border border-[rgba(236,154,163,0.14)] bg-[#08080F]/50 backdrop-blur-xl space-y-3">
                <h3 className="text-xs font-black text-[#F8F8FA] uppercase tracking-wider border-b border-[rgba(236,154,163,0.06)] pb-2">
                  ⚡ API Integrations check
                </h3>
                {profile.source_status && (
                  <div className="space-y-2 font-mono text-[10px]">
                    {Object.entries(profile.source_status).map(([source, details]: any, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-[#B6B8C4]/50">{source}</span>
                        <div className="flex gap-2">
                          <span className={`font-bold ${details.status === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                            {details.status.toUpperCase()}
                          </span>
                          <span className="text-[#B6B8C4]/30">({details.latency_ms}ms)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
