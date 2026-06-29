"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PipelineVisualization } from "./PipelineVisualization";
import { PipelineCards } from "./PipelineCards";

gsap.registerPlugin(ScrollTrigger);

export function PipelineSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const vizRef = useRef<HTMLDivElement>(null);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

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
      gsap.fromTo(titleRef.current, { opacity: 0, y: 36 }, {
        opacity: 1, y: 0, duration: 0.9, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true },
      });

      gsap.fromTo(subtitleRef.current, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.7, delay: 0.15, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 68%", once: true },
      });

      gsap.fromTo(vizRef.current, { opacity: 0, x: -30 }, {
        opacity: 1, x: 0, duration: 0.9, delay: 0.2, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 60%", once: true },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={sectionRef} className="relative w-full min-h-screen flex items-center py-24 lg:py-32" aria-labelledby="pipeline-heading">
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(236,154,163,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(236,154,163,0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-1/2 left-[25%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #EC9AA3 0%, transparent 65%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div ref={vizRef} className="order-2 lg:order-1 flex items-center justify-center opacity-0">
            <PipelineVisualization activeStage={hoveredStage} reducedMotion={reducedMotion} />
          </div>
          <div className="order-1 lg:order-2 max-w-lg">
            <h2 ref={titleRef} id="pipeline-heading" className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8F8FA] leading-[1.1] ${reducedMotion ? "" : "opacity-0"}`}>
              AI That Connects The Dots.
            </h2>
            <p ref={subtitleRef} className={`mt-6 text-lg text-[#B6B8C4] leading-relaxed ${reducedMotion ? "" : "opacity-0"}`}>
              CyberShield doesn&apos;t simply classify messages as safe or unsafe. It analyzes relationships, detects hidden patterns, calculates risk, and continuously builds fraud intelligence.
            </p>
            <div className="mt-10">
              <PipelineCards onHover={setHoveredStage} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
