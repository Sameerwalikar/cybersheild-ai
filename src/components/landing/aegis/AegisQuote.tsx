"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AegisQuoteProps {
  reducedMotion: boolean;
}

export function AegisQuote({ reducedMotion }: AegisQuoteProps) {
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion || !quoteRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        quoteRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: quoteRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div
        ref={quoteRef}
        className={`
          relative p-8 sm:p-10 rounded-2xl
          bg-[#12121A]/70 backdrop-blur-md
          border border-[rgba(236,154,163,0.18)]
          shadow-[0_8px_30px_rgba(0,0,0,0.3)]
          text-center
          ${reducedMotion ? "" : "opacity-0"}
        `}
        role="figure"
        aria-label="Quote from AEGIS, CyberShield AI Guardian"
      >
        <blockquote className="text-lg sm:text-xl text-[#F8F8FA] leading-relaxed italic">
          &ldquo;I don&apos;t just detect cyber threats. I understand them.<br />
          I don&apos;t just analyze data. I protect people.&rdquo;
        </blockquote>
        <cite className="mt-4 block text-sm font-semibold text-[#B6B8C4] not-italic">
          — AEGIS
        </cite>

        {/* Decorative accent */}
        <div className="absolute top-4 left-6 text-4xl text-[#EC9AA3]/20 select-none" aria-hidden="true">
          &ldquo;
        </div>
      </div>
    </div>
  );
}
