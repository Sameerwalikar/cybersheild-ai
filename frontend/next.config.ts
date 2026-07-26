import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Performance: output tracing root to silence lockfile warning ──
  outputFileTracingRoot: process.cwd(),

  // ── Compiler: remove console.log in production ────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // ── Images: allow optimisation of local + external sources ────────
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // ── Experimental: parallel routes + optimistic updates ────────────
  experimental: {
    // Opt in to PPR (Partial Pre-Rendering) — renders shell instantly
    // ppr: true, // uncomment once on Next 15+
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@react-three/fiber",
      "@react-three/drei",
      "three",
      "gsap",
    ],
  },
};

export default nextConfig;
