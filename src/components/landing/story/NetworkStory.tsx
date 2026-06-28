"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { NetworkInfoCard } from "./NetworkInfoCard";

gsap.registerPlugin(ScrollTrigger);

export function NetworkStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        cardRef.current,
        { opacity: 0, x: 40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          delay: 0.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 50%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen flex items-center py-24 lg:py-32"
      aria-labelledby="story-heading"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div className="max-w-lg">
            <h2
              ref={titleRef}
              id="story-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.1] opacity-0"
            >
              Cyber Threats Never Work Alone.
            </h2>

            <p
              ref={subtitleRef}
              className="mt-6 text-lg text-slate-600 leading-relaxed opacity-0"
            >
              Every scam is connected. A single phone number links to dozens of
              fraudulent accounts, devices, and victims. CyberShield AI maps
              these invisible networks in real time.
            </p>
          </div>

          {/* Right: Info card */}
          <div ref={cardRef} className="flex justify-center lg:justify-end opacity-0">
            <NetworkInfoCard />
          </div>
        </div>
      </div>
    </section>
  );
}
