"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { AegisFeatures } from "./AegisFeatures";
import { AegisQuote } from "./AegisQuote";

gsap.registerPlugin(ScrollTrigger);

const AegisScene = dynamic(
  () => import("@/components/three/AegisScene").then((m) => m.AegisScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] flex items-center justify-center">
        <div className="w-40 h-40 rounded-full bg-indigo-50/40 animate-pulse" />
      </div>
    ),
  }
);

const featureVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.4 + i * 0.12,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

export function AegisSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 72%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <>
      <section
        ref={sectionRef}
        className="relative w-full py-24 lg:py-36 overflow-hidden"
        aria-labelledby="aegis-heading"
      >
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-1/2 right-[30%] -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
            style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 60%)" }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Interaction hint */}
          <div className="hidden lg:flex justify-end mb-4">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-60">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Drag to rotate
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-8 items-center">
            {/* Left: Content */}
            <div className="order-2 lg:order-1">
              <div ref={titleRef} className={reducedMotion ? "" : "opacity-0"}>
                <h2 id="aegis-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.1]">
                  Meet{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    AEGIS
                  </span>
                </h2>

                <p className="mt-2 text-lg font-medium text-slate-500">
                  Guardian. Analyzer. Protector.
                </p>

                <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-lg">
                  AEGIS is the intelligent guardian of CyberShield AI. He continuously
                  monitors cyber threats, analyzes suspicious digital activity and assists
                  citizens and law enforcement with real-time intelligence.
                </p>
                <p className="mt-3 text-base text-slate-600 leading-relaxed max-w-lg">
                  Rather than replacing human judgment, AEGIS augments it with explainable AI,
                  helping uncover hidden fraud networks before they cause harm.
                </p>
              </div>

              {/* Features */}
              <div className="mt-10">
                <AegisFeatures
                  onHover={setHoveredFeature}
                  reducedMotion={reducedMotion}
                />
              </div>
            </div>

            {/* Right: 3D Model */}
            <div className="order-1 lg:order-2 h-[450px] lg:h-[580px]">
              <AegisScene />
            </div>
          </div>
        </div>
      </section>

      {/* Quote card */}
      <AegisQuote reducedMotion={reducedMotion} />
    </>
  );
}
