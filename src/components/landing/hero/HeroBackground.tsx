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
      {/* Base dark */}
      <div className="absolute inset-0 bg-[#050508]" />

      {/* Radial gradient — lighter center where text sits */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 35% 50%, rgba(13,13,18,0.8) 0%, transparent 60%)",
        }}
      />

      {/* Accent atmospheric glow behind globe area (right side) */}
      <div
        className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(circle, #EC9AA3 0%, transparent 65%)",
        }}
      />

      {/* Subtle top-right corner accent */}
      <div
        className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full opacity-[0.03]"
        style={{
          background:
            "radial-gradient(circle, #EC9AA3 0%, transparent 70%)",
        }}
      />

      {/* Soft vignette at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 60%, #050508 100%)",
        }}
      />
    </div>
  );
}
