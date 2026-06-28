"use client";

interface HeroBackgroundProps {
  className?: string;
}

export function HeroBackground({ className = "" }: HeroBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Base warm white with dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#FAFAF9",
          backgroundImage:
            "radial-gradient(circle, rgba(79, 70, 229, 0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Radial gradient — lighter center where text sits */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 35% 50%, rgba(255,255,255,0.8) 0%, transparent 60%)",
        }}
      />

      {/* Indigo atmospheric glow behind globe area (right side) */}
      <div
        className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.045]"
        style={{
          background:
            "radial-gradient(circle, #4F46E5 0%, transparent 65%)",
        }}
      />

      {/* Subtle top-right corner accent */}
      <div
        className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full opacity-[0.025]"
        style={{
          background:
            "radial-gradient(circle, #4F46E5 0%, transparent 70%)",
        }}
      />

      {/* Soft vignette at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(241,241,239,0.5) 100%)",
        }}
      />
    </div>
  );
}
