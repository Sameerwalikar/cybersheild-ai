"use client";

import React from "react";
import LetterGlitch from "../backgrounds/LetterGlitch";

export default function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-x-hidden bg-black">
      {/* Layer 1: LetterGlitch Background */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <LetterGlitch
          glitchSpeed={50}
          smooth={true}
          centerVignette={true}
          outerVignette={false}
        />
      </div>

      {/* Layer 2: Subtle dark overlay */}
      <div 
        className="fixed inset-0 w-full h-full z-[1] pointer-events-none" 
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.45))"
        }}
      />

      {/* Layer 3: Content */}
      <div className="relative w-full z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
