"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const roles = [
  {
    id: "citizen" as const,
    title: "Citizen",
    tagline: "Your personal cyber guardian",
    description:
      "Protect yourself and your family from phishing, UPI fraud, fake websites and social engineering attacks. CyberShield AI scans threats in real time and explains every risk in plain language.",
    features: ["Scan messages, URLs & UPI IDs", "Report scams to law enforcement", "Evidence upload & AI analysis", "AEGIS AI assistant"],
    canvasColors: [[236, 154, 163], [243, 179, 186]] as number[][],
    animationSpeed: 4,
    accentColor: "#EC9AA3",
    locked: false,
  },
  {
    id: "police" as const,
    title: "Police",
    tagline: "National cyber intelligence command",
    description:
      "Access the complete fraud intelligence network. Manage investigations, explore scammer profiles, trace financial crime across connected entities, and coordinate national-scale cybercrime response.",
    features: ["Investigation & case management", "Fraud network graph explorer", "Evidence intelligence & OCR", "National threat map"],
    canvasColors: [[96, 165, 250], [59, 130, 246]] as number[][],
    animationSpeed: 3.5,
    accentColor: "#60a5fa",
    locked: false,
  },
  {
    id: "organization" as const,
    title: "Organization",
    tagline: "Enterprise threat intelligence",
    description:
      "Protect your workforce and brand at scale. Bulk threat scanning, employee security training, brand impersonation monitoring and enterprise-grade analytics — coming to CyberShield soon.",
    features: ["Employee protection at scale", "Brand & domain monitoring", "Bulk threat analysis", "SIEM integration"],
    canvasColors: [[167, 139, 250], [139, 92, 246]] as number[][],
    animationSpeed: 3,
    accentColor: "#a78bfa",
    locked: true,
  },
];

export default function SelectRolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pre = searchParams.get("role");
    if (pre && roles.some((r) => r.id === pre && !r.locked)) setSelected(pre);
  }, [searchParams]);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    router.push(`/login?role=${selected}`);
  };

  return (
    <div className="w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <motion.div
        className="text-center mb-16 space-y-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(236,154,163,0.12)] border border-[rgba(236,154,163,0.25)] text-[11px] text-[#EC9AA3] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3] animate-pulse" />
            CyberShield AI — India&apos;s digital safety platform
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-pink-500/20 bg-pink-500/5 text-[9px] font-extrabold uppercase tracking-widest text-[#EC9AA3] animate-pulse">
            <span className="w-1 h-1 rounded-full bg-[#EC9AA3]" />
            Encrypted Session
          </span>
        </div>

        <div className="space-y-2 pt-2">
          <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">Choose your role</h1>
          <p className="text-sm text-white/70 font-medium">Select how you&apos;ll access CyberShield AI.</p>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role, i) => {
          const isSelected = selected === role.id;
          const isHovered = hovered === role.id;
          const isActive = !role.locked;

          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 + i * 0.1, ease }}
              className="relative"
            >
              <button
                type="button"
                disabled={role.locked}
                onClick={() => isActive && setSelected(role.id)}
                onMouseEnter={() => setHovered(role.id)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  group relative w-full h-[24rem] rounded-[24px] text-left overflow-hidden
                  bg-white shadow-xl
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  transition-all duration-300
                  ${role.locked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                  ${isSelected
                    ? "border-2 shadow-[0_0_0_2px_rgba(236,154,163,0.5),0_20px_60px_rgba(236,154,163,0.2)]"
                    : "border border-slate-200 hover:scale-[1.015] hover:-translate-y-1 hover:shadow-2xl"
                  }
                `}
                style={{
                  borderColor: isSelected ? role.accentColor : undefined,
                }}
              >
                {/* Canvas reveal on hover — lives behind a semi-transparent white overlay */}
                <AnimatePresence>
                  {(isHovered || isSelected) && isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 z-0"
                    >
                      <CanvasRevealEffect
                        animationSpeed={role.animationSpeed}
                        colors={role.canvasColors}
                        containerClassName="bg-transparent"
                        dotSize={2}
                        showGradient={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* White overlay so text stays readable over canvas effect */}
                <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] z-[1] transition-all duration-300" />

                {/* Content */}
                <div className="relative z-[2] h-full flex flex-col p-6">
                  {/* Icon + selected check */}
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        background: isSelected || isHovered
                          ? `radial-gradient(circle, ${role.accentColor}30 0%, ${role.accentColor}08 70%)`
                          : "rgba(0,0,0,0.04)",
                        border: `1.5px solid ${isSelected || isHovered ? role.accentColor + "60" : "rgba(0,0,0,0.08)"}`,
                      }}
                    >
                      <RoleIcon
                        id={role.id}
                        color={isSelected || isHovered ? role.accentColor : "#64748b"}
                        size={26}
                      />
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: role.accentColor }}
                      >
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    )}
                    {role.locked && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-violet-100 text-violet-600 border border-violet-200">
                        Coming soon
                      </span>
                    )}
                  </div>

                  {/* Title + tagline */}
                  <div className="space-y-1">
                    <h3
                      className="text-xl font-bold text-slate-900 transition-colors duration-200"
                      style={{ color: isSelected || isHovered ? role.accentColor : undefined }}
                    >
                      {role.title}
                    </h3>
                    <p
                      className="text-xs font-medium transition-colors duration-200"
                      style={{ color: isSelected || isHovered ? role.accentColor + "cc" : "#64748b" }}
                    >
                      {role.tagline}
                    </p>
                  </div>

                  {/* Description on hover */}
                  <AnimatePresence>
                    {(isHovered || isSelected) ? (
                      <motion.p
                        key="desc"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.25 }}
                        className="mt-4 text-xs text-slate-600 leading-relaxed"
                      >
                        {role.description}
                      </motion.p>
                    ) : (
                      <motion.div key="spacer" className="flex-1" />
                    )}
                  </AnimatePresence>

                  {/* Features */}
                  <ul className="mt-auto space-y-2 pt-4 border-t border-slate-100">
                    {role.features.map((f, fi) => (
                      <motion.li
                        key={f}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: isHovered || isSelected ? 1 : 0.6, x: 0 }}
                        transition={{ duration: 0.2, delay: fi * 0.04 }}
                        className="flex items-center gap-2 text-[10px] text-slate-600 font-medium"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: role.accentColor + "90" }}
                        />
                        {f}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Continue */}
      <motion.div
        className="mt-12 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease }}
      >
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || loading}
          className="px-12 py-3.5 rounded-xl font-bold text-sm text-white
            bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA]
            shadow-[0_4px_20px_rgba(236,154,163,0.35)]
            hover:shadow-[0_6px_24px_rgba(236,154,163,0.5)]
            hover:scale-[1.015] hover:-translate-y-0.5
            active:scale-[0.97]
            disabled:opacity-30 disabled:pointer-events-none
            transition-all duration-300 flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? "Setting up…" : "Continue"}
        </button>
        {!selected && (
          <p className="text-[11px] text-white/50 font-medium">Select a role above to continue</p>
        )}
      </motion.div>
    </div>
  );
}

function RoleIcon({ id, color, size = 22 }: { id: string; color: string; size?: number }) {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  if (id === "citizen")
    return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
  if (id === "police")
    return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>;
  return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3v4M8 3v4M2 11h20" /></svg>;
}
