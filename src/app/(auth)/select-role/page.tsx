"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

interface RoleOption {
  id: "citizen" | "police" | "organization";
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
}

const roles: RoleOption[] = [
  {
    id: "citizen",
    title: "Citizen",
    description: "Protect yourself from cyber threats with AI-powered scanning and real-time alerts.",
    features: ["Scan messages & URLs", "Report cyber threats", "Threat history & protection status"],
    icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
  },
  {
    id: "police",
    title: "Police",
    description: "Access national fraud intelligence, manage investigations, and track criminal networks.",
    features: ["Investigation management", "Fraud network graph", "Evidence tracking & analytics"],
    icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>),
  },
  {
    id: "organization",
    title: "Organization",
    description: "Protect your employees and infrastructure with enterprise-grade threat intelligence.",
    features: ["Employee protection", "Brand monitoring", "Bulk threat analysis"],
    icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3v4M8 3v4M2 11h20" /></svg>),
  },
];

export default function SelectRolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pre-select role from URL param (e.g., ?role=police)
  useEffect(() => {
    const preselect = searchParams.get("role");
    if (preselect && roles.some((r) => r.id === preselect)) {
      setSelected(preselect);
    }
  }, [searchParams]);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    router.push(`/login?role=${selected}`);
  };

  return (
    <div className="w-full max-w-4xl">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="text-2xl font-bold text-[#F8F8FA]">Choose your role</h1>
        <p className="mt-2 text-sm text-[#B6B8C4]">Select how you&apos;ll use CyberShield AI.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role, i) => (
          <motion.button
            key={role.id}
            type="button"
            onClick={() => setSelected(role.id)}
            className={`
              relative p-6 rounded-2xl text-left
              bg-[#0D0D12]/90 backdrop-blur-sm border
              transition-all duration-[220ms] ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]
              ${selected === role.id
                ? "border-[#EC9AA3] shadow-[0_0_30px_rgba(236,154,163,0.12)]"
                : "border-[rgba(236,154,163,0.1)] hover:border-[rgba(236,154,163,0.25)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
              }
            `}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease }}
            aria-pressed={selected === role.id}
          >
            {selected === role.id && (
              <motion.div
                className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#EC9AA3] flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#050508" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            )}

            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 ${selected === role.id ? "bg-[rgba(236,154,163,0.12)] text-[#EC9AA3]" : "bg-[#12121A] text-[#B6B8C4]"}`}>
              {role.icon}
            </div>

            <h3 className="text-base font-semibold text-[#F8F8FA] mb-1">{role.title}</h3>
            <p className="text-xs text-[#B6B8C4] leading-relaxed mb-4">{role.description}</p>

            <ul className="space-y-1.5">
              {role.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-[11px] text-[#B6B8C4]">
                  <div className="w-1 h-1 rounded-full bg-[#EC9AA3]/50" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.button>
        ))}
      </div>

      <motion.div
        className="mt-8 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4, ease }}
      >
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || loading}
          className="px-10 py-3.5 rounded-xl font-semibold text-sm text-[#050508] bg-[#EC9AA3] shadow-[0_2px_12px_rgba(236,154,163,0.2)] hover:shadow-[0_6px_20px_rgba(236,154,163,0.25)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? "Setting up..." : "Continue"}
        </button>
      </motion.div>
    </div>
  );
}
