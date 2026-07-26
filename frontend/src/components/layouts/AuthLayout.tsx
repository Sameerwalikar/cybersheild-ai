"use client";

import React, { lazy, Suspense } from "react";
import { usePathname } from "next/navigation";
import { AuthBackButton } from "../auth/AuthBackButton";

// Lazy-load the heavy canvas background — don't block initial auth form render
const LetterGlitch = lazy(() => import("../backgrounds/LetterGlitch"));

const BACK_DESTINATIONS: Record<string, string> = {
  "/select-role": "/",
  "/login":       "/select-role",
  "/register":    "/select-role",
};

export default function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const backHref = Object.entries(BACK_DESTINATIONS).find(([key]) =>
    pathname.startsWith(key)
  )?.[1];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-x-hidden bg-black">
      {/* LetterGlitch — lazy-loaded so it doesn't block first paint */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <Suspense fallback={null}>
          <LetterGlitch
            glitchSpeed={50}
            smooth={true}
            centerVignette={true}
            outerVignette={false}
          />
        </Suspense>
      </div>

      {/* Dark overlay */}
      <div
        className="fixed inset-0 w-full h-full z-[1] pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.45))" }}
      />

      {/* Back button */}
      {backHref && <AuthBackButton href={backHref} />}

      {/* Content — always above the background */}
      <div className="relative w-full z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
