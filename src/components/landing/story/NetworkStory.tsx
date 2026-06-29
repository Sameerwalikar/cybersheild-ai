"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { FraudStatsCard } from "./FraudStatsCard";

gsap.registerPlugin(ScrollTrigger);

const FraudGraph = dynamic(
  () => import("@/components/three/FraudGraph").then((m) => m.FraudGraph),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[350px] flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-[#EC9AA3]/5 animate-pulse" />
      </div>
    ),
  }
);

const bullets = [
  "Connects Digital Evidence",
  "Detects Hidden Relationships",
  "Builds Fraud Intelligence Networks",
];

const bulletVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      delay: 0.6 + i * 0.15,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

export function NetworkStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !sectionRef.current) {
      setStatsVisible(true);
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.9, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true },
      });

      gsap.fromTo(subtitleRef.current, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 0.7, delay: 0.15, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 68%", once: true },
      });

      gsap.fromTo(graphRef.current, { opacity: 0, scale: 0.92 }, {
        opacity: 1, scale: 1, duration: 1, delay: 0.3, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 55%", once: true },
      });

      gsap.fromTo(cardWrapRef.current, { opacity: 0, x: 30 }, {
        opacity: 1, x: 0, duration: 0.8, delay: 0.5, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 45%", once: true, onEnter: () => setStatsVisible(true) },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen flex items-center py-24 lg:py-32"
      aria-labelledby="story-heading"
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(circle, #EC9AA3 0%, transparent 65%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="max-w-lg">
            <h2 ref={titleRef} id="story-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8F8FA] leading-[1.1] opacity-0">
              Cyber Threats Never Work Alone.
            </h2>
            <p ref={subtitleRef} className="mt-6 text-lg text-[#B6B8C4] leading-relaxed opacity-0">
              Traditional systems analyze scams in isolation. CyberShield AI connects people, devices, UPI IDs, websites, phone numbers, complaints, and evidence into one living intelligence network — uncovering organized cybercrime instead of isolated incidents.
            </p>
            <ul className="mt-8 space-y-3" role="list">
              {bullets.map((bullet, i) => (
                <motion.li key={bullet} className="flex items-center gap-3 text-[#F8F8FA]" variants={bulletVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }} custom={i}>
                  <span className="w-2 h-2 rounded-full bg-[#EC9AA3] flex-shrink-0" />
                  <span className="text-sm font-medium">{bullet}</span>
                </motion.li>
              ))}
            </ul>
            <div ref={cardWrapRef} className="opacity-0">
              <FraudStatsCard visible={statsVisible} />
            </div>
          </div>
          <div ref={graphRef} className="opacity-0 flex items-center justify-center h-[400px] lg:h-[500px]">
            <FraudGraph />
          </div>
        </div>
      </div>
    </section>
  );
}
