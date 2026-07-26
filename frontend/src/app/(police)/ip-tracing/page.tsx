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
  last_checked?: string;
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
      .catch((err) => {
        if (err.message.includes("token")) {
          console.warn("User not authenticated. Quotas will not load until login.");
        } else {
          console.warn("Failed to load quotas:", err.message);
        }
      });
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
    <div className="relative space-y-6 pb-12">

      {/* subtle background grid / scan effect */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,.7) 0 1px, transparent 1px 4px)",
        }}
      />

      {/* ============================================================
          HEADER
      ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative"
      >
        <div className="flex items-end justify-between gap-4">

          <div>
            <p className="text-[9px] font-mono tracking-[0.35em] text-[#EC9AA3]/50 uppercase mb-2">
              CyberShield // Network Intelligence
            </p>

            <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight">
              IP Forensics & Tracing
            </h1>

            <p className="mt-1.5 text-xs text-[#B6B8C4]/55 font-medium">
              Consolidate reputation metrics, geolocate network infrastructure,
              and analyze threat intelligence.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[9px] font-mono tracking-[0.2em] text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]" />
            INTELLIGENCE SYSTEM ACTIVE
          </div>

        </div>
      </motion.div>


      {/* ============================================================
          IP INTELLIGENCE QUERY
      ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
      >
        <IntelPanel title="IP Intelligence Query" glow>

          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row gap-3"
          >

            <div className="relative flex-1">

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.28em] font-mono text-[#EC9AA3]">
                IP&gt;
              </span>

              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                disabled={loading}
                placeholder="0.0.0.0"
                className="
                  w-full
                  pl-14 pr-4 py-3
                  bg-[#0E0E16]
                  border border-[rgba(236,154,163,0.18)]
                  text-[#F8F8FA]
                  text-sm font-mono
                  outline-none
                  focus:border-[rgba(236,154,163,0.45)]
                  transition-colors
                "
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                px-7 py-3
                text-[10px]
                tracking-[0.28em]
                uppercase font-black
                bg-[#EC9AA3]
                text-[#17090C]
                border border-[#EC9AA3]
                hover:bg-[#F3B3BA]
                disabled:opacity-50
                transition-all
              "
            >
              {loading ? "Scanning..." : "Scan Address"}
            </button>

          </form>


          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[9px] tracking-[0.2em] uppercase font-mono text-[#8A8A96]">

            <StatusChip
              label="API Status"
              value="ACTIVE"
              good
            />

            <StatusChip
              label="Cache"
              value="ACTIVE"
              good
            />

            {quotas && (
              <span>
                AbuseIPDB ·{" "}
                <span className="text-[#F8F8FA]">
                  {quotas.abuseIPDB?.remaining ?? "—"}
                </span>{" "}
                / {quotas.abuseIPDB?.limit ?? "—"} remaining
              </span>
            )}

          </div>

        </IntelPanel>
      </motion.div>


      {/* ============================================================
          ERROR
      ============================================================ */}

      <AnimatePresence>
        {error && (

          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="
              p-4
              border border-red-500/25
              bg-red-500/5
              text-sm
              font-medium
              text-red-400
            "
          >
            {error}
          </motion.div>

        )}
      </AnimatePresence>


      {/* ============================================================
          RESULT
      ============================================================ */}

      <AnimatePresence>
        {profile && (

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >

            {/* ========================================================
                MAIN INTELLIGENCE GRID
            ======================================================== */}

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">


              {/* ======================================================
                  LEFT
              ====================================================== */}

              <div className="space-y-6">

                <IntelPanel
                  title={`IP Intelligence // ${profile.ip}`}
                  glow
                  meta={
                    <div className="flex flex-wrap gap-3">

                      <MiniBadge
                        label="Risk"
                        value={getRiskLabel(profile.risk_score ?? 0)}
                        color={getRiskHex(profile.risk_score ?? 0)}
                      />

                      <MiniBadge
                        label="Confidence"
                        value={(profile.confidence ?? "low").toUpperCase()}
                        color="#EC9AA3"
                      />

                    </div>
                  }
                >

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* NETWORK IDENTITY */}

                    <div>

                      <SectionLabel>
                        Network Identity
                      </SectionLabel>

                      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 mt-4">

                        <IntelField
                          label="IP Address"
                          value={profile.ip}
                          mono
                        />

                        <IntelField
                          label="ISP / Organization"
                          value={profile.asn?.org || "Unknown"}
                        />

                        <IntelField
                          label="ASN"
                          value={
                            profile.asn?.number
                              ? `AS${profile.asn.number}`
                              : "Unknown"
                          }
                          mono
                        />

                        <IntelField
                          label="Network Type"
                          value={profile.asn?.type || "Unknown"}
                        />

                        <IntelField
                          label="Country"
                          value={profile.geo?.country || "Unknown"}
                        />

                        <IntelField
                          label="Approximate City"
                          value={profile.geo?.city || "Unknown"}
                        />

                        <IntelField
                          label="Coordinates"
                          value={
                            profile.geo
                              ? `${profile.geo.lat.toFixed(4)}, ${profile.geo.lon.toFixed(4)}`
                              : "Unknown"
                          }
                          mono
                        />

                        <IntelField
                          label="Accuracy Radius"
                          value={
                            profile.geo?.accuracy_km != null
                              ? `± ${profile.geo.accuracy_km} km`
                              : "Unknown"
                          }
                          mono
                        />

                      </dl>

                    </div>


                    {/* MAP */}

                    <div>

                      <SectionLabel>
                        Approximate IP Geolocation
                      </SectionLabel>

                      {profile.geo &&
                      typeof profile.geo.lat === "number" &&
                      typeof profile.geo.lon === "number" ? (

                        <>

                          <div className="relative mt-4 overflow-hidden border border-[rgba(236,154,163,0.18)]">

                            <div className="relative h-[300px]">

                              <IpMap
                                lat={profile.geo.lat}
                                lon={profile.geo.lon}
                                city={profile.geo.city}
                                country={profile.geo.country}
                              />

                            </div>

                            {/* HUD target */}

                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                              <div className="relative w-16 h-16">

                                <span className="absolute inset-0 rounded-full border border-[#EC9AA3]/40 animate-ping" />

                                <span className="absolute inset-3 rounded-full border border-[#EC9AA3]" />

                                <span className="absolute left-1/2 top-0 h-3 w-px bg-[#EC9AA3]" />
                                <span className="absolute left-1/2 bottom-0 h-3 w-px bg-[#EC9AA3]" />
                                <span className="absolute top-1/2 left-0 w-3 h-px bg-[#EC9AA3]" />
                                <span className="absolute top-1/2 right-0 w-3 h-px bg-[#EC9AA3]" />

                                <span className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EC9AA3] shadow-[0_0_12px_#EC9AA3]" />

                              </div>

                            </div>

                          </div>


                          <div className="mt-3">

                            <div className="text-sm text-[#F8F8FA]">
                              {profile.geo.city}, {profile.geo.country}
                            </div>

                            <div className="text-[10px] font-mono text-[#EC9AA3] mt-1">
                              {profile.geo.lat.toFixed(4)},{" "}
                              {profile.geo.lon.toFixed(4)}
                            </div>

                            <div className="text-[10px] text-[#8A8A96] mt-1">
                              Approximate network location · accuracy ±
                              {profile.geo.accuracy_km ?? "?"} km
                            </div>

                          </div>

                        </>

                      ) : (

                        <p className="mt-4 text-xs text-[#8A8A96]">
                          No geolocation intelligence available.
                        </p>

                      )}

                    </div>

                  </div>

                </IntelPanel>


                {/* ====================================================
                    NETWORK REGISTRY
                ==================================================== */}

                <IntelPanel title="Network Ownership / RDAP">

                  {profile.network_ownership ? (

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                      <IntelField
                        label="CIDR"
                        value={profile.network_ownership.cidr || "Unknown"}
                        mono
                      />

                      <IntelField
                        label="Abuse Contact"
                        value={
                          profile.network_ownership.abuse_contact ||
                          "Unavailable"
                        }
                        mono
                      />

                      <IntelField
                        label="Registration Country"
                        value={
                          profile.network_ownership.registration_country ||
                          "Unknown"
                        }
                      />

                      <IntelField
                        label="Allocation Date"
                        value={
                          profile.network_ownership.allocation_date
                            ? new Date(
                                profile.network_ownership.allocation_date
                              ).toLocaleDateString()
                            : "Unknown"
                        }
                        mono
                      />

                    </div>

                  ) : (

                    <p className="text-xs text-[#8A8A96]">
                      Network registry information unavailable.
                    </p>

                  )}

                </IntelPanel>


                {/* ====================================================
                    SECURITY LISTING
                ==================================================== */}

                <IntelPanel title="Security Listings & Actions">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>

                      <label className="block mb-2 text-[9px] tracking-[0.22em] uppercase text-[#8A8A96]">
                        List Classification
                      </label>

                      <select
                        value={listType}
                        onChange={(e) =>
                          setListType(
                            e.target.value as "blocklist" | "allowlist"
                          )
                        }
                        className="
                          w-full px-3 py-3
                          bg-[#0E0E16]
                          border border-[rgba(236,154,163,0.18)]
                          text-xs text-[#F8F8FA]
                          outline-none
                        "
                      >
                        <option value="blocklist">
                          Blocklist — Force block in Aegis
                        </option>

                        <option value="allowlist">
                          Allowlist — Exempt from flags
                        </option>

                      </select>

                    </div>


                    <div>

                      <label className="block mb-2 text-[9px] tracking-[0.22em] uppercase text-[#8A8A96]">
                        Investigation Note
                      </label>

                      <input
                        type="text"
                        value={listNote}
                        onChange={(e) => setListNote(e.target.value)}
                        placeholder="Add investigation context..."
                        className="
                          w-full px-3 py-3
                          bg-[#0E0E16]
                          border border-[rgba(236,154,163,0.18)]
                          text-xs text-[#F8F8FA]
                          outline-none
                          focus:border-[rgba(236,154,163,0.45)]
                        "
                      />

                    </div>

                  </div>


                  <button
                    onClick={handleAddToList}
                    className={`
                      mt-4 w-full py-3
                      text-[10px] font-black
                      tracking-[0.25em]
                      uppercase
                      border
                      transition-colors

                      ${
                        listType === "blocklist"
                          ? "text-red-400 border-red-500/30 bg-red-500/[0.06] hover:bg-red-500/[0.12]"
                          : "text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12]"
                      }
                    `}
                  >
                    {listType === "blocklist"
                      ? "Add To Blocklist"
                      : "Add To Allowlist"}
                  </button>


                  {listSuccess && (

                    <p className="mt-3 text-[11px] text-emerald-400 text-center font-mono">
                      {listSuccess}
                    </p>

                  )}

                </IntelPanel>

              </div>


              {/* ======================================================
                  RIGHT COLUMN
              ====================================================== */}

              <div className="space-y-6">


                {/* THREAT ASSESSMENT */}

                <IntelPanel title="Threat Assessment">

                  <ThreatAssessment
                    score={profile.risk_score ?? 0}
                    confidence={profile.confidence ?? "low"}
                    flags={profile.network_flags}
                    abuseReports={
                      profile.reputation?.abuseipdb_reports ?? 0
                    }
                    cyberReports={
                      profile.internal?.cybershield_report_count ?? 0
                    }
                  />

                </IntelPanel>


                {/* RISK INDICATORS */}

                <IntelPanel title="Risk Indicators">

                  <div className="divide-y divide-[rgba(236,154,163,0.10)]">

                    <RiskRow
                      label="Tor Exit Node"
                      value={profile.network_flags?.is_tor ? "YES" : "NO"}
                      dangerous={!!profile.network_flags?.is_tor}
                    />

                    <RiskRow
                      label="VPN"
                      value={profile.network_flags?.is_vpn ? "YES" : "NO"}
                      dangerous={!!profile.network_flags?.is_vpn}
                    />

                    <RiskRow
                      label="Proxy Node"
                      value={profile.network_flags?.is_proxy ? "YES" : "NO"}
                      dangerous={!!profile.network_flags?.is_proxy}
                    />

                    <RiskRow
                      label="Hosting / Datacenter"
                      value={
                        profile.network_flags?.is_hosting ? "YES" : "NO"
                      }
                      warning={!!profile.network_flags?.is_hosting}
                    />

                    <RiskRow
                      label="Abuse Reports"
                      value={String(
                        profile.reputation?.abuseipdb_reports ?? 0
                      )}
                      dangerous={
                        (profile.reputation?.abuseipdb_reports ?? 0) > 0
                      }
                    />

                    <RiskRow
                      label="CyberShield Reports"
                      value={String(
                        profile.internal?.cybershield_report_count ?? 0
                      )}
                      dangerous={
                        (profile.internal?.cybershield_report_count ?? 0) >
                        0
                      }
                    />

                  </div>


                  {profile.score_breakdown &&
                    profile.score_breakdown.length > 0 && (

                      <div className="mt-5 pt-4 border-t border-[rgba(236,154,163,0.12)]">

                        <SectionLabel>
                          Score Breakdown
                        </SectionLabel>

                        <div className="mt-3 space-y-2">

                          {profile.score_breakdown.map((item, idx) => (

                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3 text-[10px]"
                            >

                              <span className="text-[#8A8A96]">
                                {item.indicator}
                              </span>

                              <span
                                className={`font-mono font-bold ${
                                  item.points > 0
                                    ? "text-red-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {item.points > 0
                                  ? `+${item.points}`
                                  : item.points}
                              </span>

                            </div>

                          ))}

                        </div>

                      </div>

                    )}

                </IntelPanel>


                {/* INTELLIGENCE SOURCES */}

                <IntelPanel title="Intelligence Sources">

                  {profile.source_status ? (

                    <div className="space-y-3">

                      {Object.entries(profile.source_status).map(
                        ([source, details]) => (

                          <SourceRow
                            key={source}
                            name={source}
                            status={details.status}
                            latency={details.latency_ms}
                          />

                        )
                      )}

                    </div>

                  ) : (

                    <p className="text-xs text-[#8A8A96]">
                      Source telemetry unavailable.
                    </p>

                  )}

                </IntelPanel>

              </div>

            </div>


            {/* ========================================================
                CYBERSHIELD INTERNAL INTELLIGENCE
            ======================================================== */}

            <IntelPanel
              title="CyberShield Connections / Internal Intelligence"
              glow
            >

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

                <div className="relative min-h-[230px] flex items-center justify-center overflow-hidden">

                  <svg
                    viewBox="0 0 800 230"
                    className="w-full min-w-[650px] h-[230px]"
                  >

                    {/* Root → reports */}

                    <line
                      x1="400"
                      y1="65"
                      x2="220"
                      y2="160"
                      stroke="rgba(236,154,163,.35)"
                      strokeDasharray="4 4"
                    />

                    <line
                      x1="400"
                      y1="65"
                      x2="400"
                      y2="160"
                      stroke="rgba(236,154,163,.35)"
                      strokeDasharray="4 4"
                    />

                    <line
                      x1="400"
                      y1="65"
                      x2="580"
                      y2="160"
                      stroke="rgba(236,154,163,.35)"
                      strokeDasharray="4 4"
                    />


                    <GraphNode
                      x={400}
                      y={45}
                      width={230}
                      title={profile.ip}
                      subtitle="TARGET IP"
                      active
                    />

                    <GraphNode
                      x={220}
                      y={160}
                      title={String(
                        profile.internal?.cybershield_report_count ?? 0
                      )}
                      subtitle="REPORT MATCHES"
                    />

                    <GraphNode
                      x={400}
                      y={160}
                      title={
                        profile.reputation?.abuseipdb_reports
                          ? String(
                              profile.reputation.abuseipdb_reports
                            )
                          : "0"
                      }
                      subtitle="ABUSE REPORTS"
                    />

                    <GraphNode
                      x={580}
                      y={160}
                      title={
                        profile.network_flags?.is_vpn ||
                        profile.network_flags?.is_proxy ||
                        profile.network_flags?.is_tor
                          ? "DETECTED"
                          : "CLEAR"
                      }
                      subtitle="NETWORK FLAGS"
                    />

                  </svg>

                </div>


                <div className="border-l border-[rgba(236,154,163,0.12)] pl-6">

                  <SectionLabel>
                    Internal Record
                  </SectionLabel>

                  <div className="mt-4 space-y-4">

                    <IntelField
                      label="CyberShield Reports"
                      value={String(
                        profile.internal?.cybershield_report_count ?? 0
                      )}
                      mono
                    />

                    <IntelField
                      label="First Seen"
                      value={
                        profile.internal?.first_seen
                          ? new Date(
                              profile.internal.first_seen
                            ).toLocaleString()
                          : "No internal history"
                      }
                      mono
                    />

                    <IntelField
                      label="Last Seen"
                      value={
                        profile.internal?.last_seen
                          ? new Date(
                              profile.internal.last_seen
                            ).toLocaleString()
                          : "No internal history"
                      }
                      mono
                    />

                  </div>

                </div>

              </div>

            </IntelPanel>


            {/* ========================================================
                RECENT INTELLIGENCE ACTIVITY
            ======================================================== */}

            <IntelPanel title="Current Scan Activity">

              <ActivityTimeline
                events={[
                  {
                    label: "IP Intelligence Query",
                    status: "COMPLETE",
                  },
                  {
                    label: "Geolocation Resolution",
                    status: profile.geo ? "COMPLETE" : "UNAVAILABLE",
                  },
                  {
                    label: "ASN Identification",
                    status: profile.asn ? "COMPLETE" : "UNAVAILABLE",
                  },
                  {
                    label: "Network Registry / RDAP",
                    status: profile.network_ownership
                      ? "COMPLETE"
                      : "UNAVAILABLE",
                  },
                  {
                    label: "Threat Reputation Analysis",
                    status: "COMPLETE",
                  },
                  {
                    label: "CyberShield Internal Search",
                    status: "COMPLETE",
                  },
                ]}
              />

            </IntelPanel>

          </motion.div>

        )}
      </AnimatePresence>

    </div>
  );
}
/* ================================================================
   FILTERED LOVABLE HUD HELPERS
   Kept in this file intentionally.
================================================================ */

const CS = {
  bg: "#050508",
  panel: "#0A0A11",
  panelAlt: "#0E0E16",
  border: "rgba(236,154,163,0.18)",
  borderStrong: "rgba(236,154,163,0.35)",
  text: "#F8F8FA",
  textDim: "#8A8A96",
  pink: "#EC9AA3",
  critical: "#F87171",
  high: "#FB923C",
  medium: "#F59E0B",
  safe: "#34D399",
} as const;


function IntelPanel({
  title,
  meta,
  children,
  className = "",
  glow = false,
}: {
  title?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (

    <section
      className={`relative ${className}`}
      style={{
        backgroundColor: CS.panel,
        border: `1px solid ${CS.border}`,
        boxShadow: glow
          ? `0 0 0 1px rgba(236,154,163,.05),
             0 0 24px -12px rgba(236,154,163,.35)`
          : "0 0 0 1px rgba(255,255,255,.02)",
      }}
    >

      {/* HUD corners */}

      <span className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t border-[#EC9AA3]" />
      <span className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-r border-t border-[#EC9AA3]" />
      <span className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#EC9AA3]" />
      <span className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#EC9AA3]" />


      {/* subtle scan lines */}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,.7) 0 1px, transparent 1px 4px)",
        }}
      />


      {title && (

        <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3 border-b border-[rgba(236,154,163,0.14)]">

          <h2 className="text-[10px] tracking-[0.28em] uppercase text-[#F8F8FA]">
            {title}
          </h2>

          {meta && (
            <div className="text-[9px] uppercase tracking-[0.16em]">
              {meta}
            </div>
          )}

        </header>

      )}


      <div className="relative p-5">
        {children}
      </div>

    </section>

  );
}


function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <div className="pb-2 border-b border-[rgba(236,154,163,0.14)] text-[9px] tracking-[0.28em] uppercase text-[#EC9AA3]">
      {children}
    </div>

  );
}


function IntelField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (

    <div className="min-w-0">

      <dt className="text-[8px] tracking-[0.22em] uppercase text-[#8A8A96]">
        {label}
      </dt>

      <dd
        className={`mt-1 text-[12px] text-[#F8F8FA] break-words ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </dd>

    </div>

  );
}


function StatusChip({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (

    <span className="flex items-center gap-2">

      <span
        className={`w-1.5 h-1.5 rounded-full ${
          good
            ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
            : "bg-orange-400 shadow-[0_0_6px_#fb923c]"
        }`}
      />

      {label} ·

      <span className="text-[#F8F8FA]">
        {value}
      </span>

    </span>

  );
}


function MiniBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (

    <span className="flex items-center gap-2">

      <span className="text-[#8A8A96]">
        {label}
      </span>

      <span
        className="px-2 py-0.5 font-mono"
        style={{
          color,
          border: `1px solid ${color}55`,
        }}
      >
        {value}
      </span>

    </span>

  );
}

function ThreatAssessment({
  score,
  confidence,
  flags,
  abuseReports,
  cyberReports,
}: {
  score: number;
  confidence: string;
  flags?: IPEntity["network_flags"];
  abuseReports: number;
  cyberReports: number;
}) {

  const color = getRiskHex(score);

  const reasons = [
    {
      text: flags?.is_tor
        ? "Known Tor exit node detected"
        : "Not a known Tor exit node",
      danger: !!flags?.is_tor,
    },
    {
      text: flags?.is_vpn
        ? "VPN infrastructure detected"
        : "No VPN indicator detected",
      danger: !!flags?.is_vpn,
    },
    {
      text: flags?.is_proxy
        ? "Proxy infrastructure detected"
        : "No proxy indicator detected",
      danger: !!flags?.is_proxy,
    },
    {
      text: flags?.is_hosting
        ? "Hosting / datacenter network"
        : "Not identified as hosting infrastructure",
      danger: !!flags?.is_hosting,
    },
    {
      text:
        abuseReports > 0
          ? `${abuseReports} abuse report(s) detected`
          : "No abuse reports detected",
      danger: abuseReports > 0,
    },
    {
      text:
        cyberReports > 0
          ? `${cyberReports} CyberShield report match(es)`
          : "No CyberShield report matches",
      danger: cyberReports > 0,
    },
  ];

  return (

    <div className="flex flex-col items-center gap-4">

      <div
        className="text-6xl leading-none font-mono"
        style={{ color }}
      >
        {String(score).padStart(2, "0")}
      </div>

      <div
        className="text-[10px] tracking-[0.3em] font-black"
        style={{ color }}
      >
        {getRiskLabel(score)}
      </div>


      <div className="w-full">

        <div className="relative h-2 overflow-hidden bg-[#1A1A22] border border-[rgba(236,154,163,0.18)]">

          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${Math.max(0, Math.min(100, score))}%`,
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}80`,
            }}
          />

        </div>


        <div className="mt-1 flex justify-between text-[9px] font-mono text-[#8A8A96]">

          <span>
            {score} / 100
          </span>

          <span>
            {score < 25
              ? "SAFE / CLEAR"
              : score < 50
              ? "ELEVATED"
              : score < 75
              ? "HIGH RISK"
              : "CRITICAL"}
          </span>

        </div>

      </div>


      <div className="w-full pt-3 border-t border-[rgba(236,154,163,0.12)] space-y-2">

        {reasons.map((reason, index) => (

          <div
            key={index}
            className="flex gap-2 text-[11px]"
          >

            <span
              className={
                reason.danger
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            >
              {reason.danger ? "!" : "✓"}
            </span>

            <span className="text-[#B6B8C4]">
              {reason.text}
            </span>

          </div>

        ))}

      </div>


      <div className="w-full pt-3 border-t border-[rgba(236,154,163,0.12)] text-[9px] tracking-[0.18em] uppercase font-mono text-[#8A8A96]">

        Confidence ·{" "}

        <span className="text-[#EC9AA3]">
          {confidence.toUpperCase()}
        </span>

      </div>

    </div>

  );
}

function RiskRow({
  label,
  value,
  dangerous = false,
  warning = false,
}: {
  label: string;
  value: string;
  dangerous?: boolean;
  warning?: boolean;
}) {

  const color = dangerous
    ? "text-red-400"
    : warning
    ? "text-orange-400"
    : "text-emerald-400";

  return (

    <div className="flex items-center justify-between py-2.5">

      <span className="text-[11px] text-[#B6B8C4]">
        {label}
      </span>

      <span
        className={`text-[10px] tracking-[0.18em] font-mono font-bold ${color}`}
      >
        {value}
      </span>

    </div>

  );
}

function SourceRow({
  name,
  status,
  latency,
}: {
  name: string;
  status: string;
  latency: number;
}) {

  const good = status.toLowerCase() === "ok";

  return (

    <div className="flex items-center justify-between px-3 py-2.5 bg-[#0E0E16] border border-[rgba(236,154,163,0.14)]">

      <div className="flex items-center gap-3">

        <span
          className={`w-1.5 h-1.5 rounded-full ${
            good
              ? "bg-emerald-400 shadow-[0_0_7px_#34d399]"
              : "bg-red-400 shadow-[0_0_7px_#f87171]"
          }`}
        />

        <span className="text-[11px] text-[#F8F8FA]">
          {name}
        </span>

      </div>


      <div className="flex items-center gap-3 font-mono">

        <span
          className={`text-[9px] tracking-[0.18em] ${
            good ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {status.toUpperCase()}
        </span>

        <span className="text-[9px] text-[#8A8A96]">
          {latency}ms
        </span>

      </div>

    </div>

  );
}

function GraphNode({
  x,
  y,
  title,
  subtitle,
  width = 145,
  active = false,
}: {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  width?: number;
  active?: boolean;
}) {

  const height = 52;

  return (

    <g transform={`translate(${x - width / 2}, ${y - height / 2})`}>

      <rect
        width={width}
        height={height}
        fill="#0E0E16"
        stroke={
          active
            ? "#EC9AA3"
            : "rgba(236,154,163,.35)"
        }
      />


      <text
        x={width / 2}
        y="22"
        textAnchor="middle"
        fontSize="11"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill={
          active
            ? "#F8F8FA"
            : "#EC9AA3"
        }
      >
        {title}
      </text>


      <text
        x={width / 2}
        y="39"
        textAnchor="middle"
        fontSize="8"
        letterSpacing="1.5"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#8A8A96"
      >
        {subtitle}
      </text>

    </g>

  );
}

function ActivityTimeline({
  events,
}: {
  events: {
    label: string;
    status: string;
  }[];
}) {

  return (

    <div className="relative pl-7">

      <span className="absolute left-[7px] top-2 bottom-2 w-px bg-[rgba(236,154,163,0.18)]" />


      {events.map((event, index) => {

        const complete = event.status === "COMPLETE";

        return (

          <div
            key={index}
            className="relative py-2"
          >

            <span className="absolute -left-7 top-3 w-3.5 h-3.5 border border-[#EC9AA3] bg-[#050508] flex items-center justify-center">

              <span
                className={`w-1 h-1 ${
                  complete
                    ? "bg-[#EC9AA3]"
                    : "bg-[#8A8A96]"
                }`}
              />

            </span>


            <div className="flex flex-wrap items-center justify-between gap-3">

              <span className="text-[10px] tracking-[0.14em] uppercase text-[#F8F8FA]">
                {event.label}
              </span>

              <span
                className={`text-[9px] font-mono tracking-[0.18em] ${
                  complete
                    ? "text-emerald-400"
                    : "text-[#8A8A96]"
                }`}
              >
                {event.status}
              </span>

            </div>

          </div>

        );

      })}

    </div>
 );
}

function getRiskHex(score: number) {
  if (score >= 75) return "#F87171";
  if (score >= 50) return "#FB923C";
  if (score >= 25) return "#F59E0B";
  return "#34D399";
}
function getRiskLabel(score: number) {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";

  return "LOW";
}