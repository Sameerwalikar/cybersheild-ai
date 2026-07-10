"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const trustIndicators = [
  { label: "Explainable AI", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>) },
  { label: "Privacy First", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>) },
  { label: "Built for India", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" /><path d="M12 2v20M2 12h20" /></svg>) },
  { label: "Graph Intelligence", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="M6 9v6M18 9v-3M9 6h6" /></svg>) },
  { label: "Real-time Protection", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8Z" /></svg>) },
];

// Deterministic particle positions for logo convergence
function seededPos(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return (x - Math.floor(x));
}

const CONVERGENCE_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  startX: Math.round(seededPos(i * 7 + 1) * 800 + 100) / 10,
  startY: Math.round(seededPos(i * 7 + 2) * 600 + 200) / 10,
}));

export function FinaleSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    if (mq.matches) setIsVisible(true);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 70%",
        once: true,
        onEnter: () => setIsVisible(true),
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-32 lg:py-44 overflow-hidden"
      aria-labelledby="finale-heading"
    >
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #EC9AA3 0%, transparent 60%)" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Convergence particles → logo */}
        <div className="relative w-24 h-24 mx-auto mb-10">
          {/* Particles converging */}
          {CONVERGENCE_PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-[#EC9AA3]/60"
              initial={{ left: `${p.startX}%`, top: `${p.startY}%`, opacity: 0, scale: 0.5 }}
              animate={isVisible ? { left: "50%", top: "50%", opacity: [0, 0.8, 0], scale: [0.5, 1, 0] } : {}}
              transition={{ duration: 1.8, delay: 0.2 + i * 0.08, ease }}
            />
          ))}

          {/* Logo */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9, delay: 1.6, ease }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center shadow-xl shadow-[rgba(236,154,163,0.2)]">
              <span className="text-2xl font-bold text-[#050508]">CS</span>
            </div>
          </motion.div>
        </div>

        {/* Heading */}
        <motion.h2
          id="finale-heading"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8F8FA] leading-[1.1]"
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={isVisible ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.7, delay: 2.0, ease }}
        >
          Protecting India&apos;s Digital Future.
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="mt-6 text-lg text-[#B6B8C4] leading-relaxed max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 2.4, ease }}
        >
          CyberShield AI empowers citizens, organizations and law enforcement
          with explainable artificial intelligence, connected fraud intelligence
          and proactive cyber protection.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="mt-12 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 2.8, ease }}
        >
          <Link
            href="/select-role"
            className="px-8 py-4 rounded-xl font-semibold text-[#050508] text-sm bg-[#EC9AA3] shadow-[0_2px_12px_rgba(236,154,163,0.2)] hover:shadow-[0_8px_28px_rgba(236,154,163,0.3)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
          >
            Launch Citizen Portal
          </Link>
          <Link
            href="/select-role?role=police"
            className="px-8 py-4 rounded-xl font-semibold text-[#F8F8FA] text-sm border border-[rgba(236,154,163,0.2)] bg-[#12121A]/70 backdrop-blur-sm hover:border-[rgba(236,154,163,0.4)] hover:text-[#F3B3BA] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(236,154,163,0.06)] active:scale-[0.97] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
          >
            Explore Police Dashboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-xl font-semibold text-[#B6B8C4] text-sm hover:text-[#F8F8FA] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
          >
            View GitHub Repository
          </a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          className="mt-16 flex flex-wrap justify-center gap-6 lg:gap-10"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 3.2, ease }}
        >
          {trustIndicators.map((item, i) => (
            <motion.div
              key={item.label}
              className="flex items-center gap-2.5 text-[#B6B8C4]"
              initial={{ opacity: 0, y: 8 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 3.2 + i * 0.1, ease }}
            >
              <div className="text-[#EC9AA3]/70">{item.icon}</div>
              <span className="text-xs font-medium">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* AEGIS final message */}
        <motion.div
          className="mt-20 inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-[#12121A]/60 border border-[rgba(236,154,163,0.1)]"
          initial={{ opacity: 0, y: 10 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 3.8, ease }}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-[#050508]">A</span>
          </div>
          <p className="text-xs text-[#B6B8C4] italic leading-relaxed">
            &ldquo;We don&apos;t wait for cybercrime. We prevent it.&rdquo;
          </p>
        </motion.div>
      </div>
    </section>
  );
}
