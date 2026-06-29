export const config = {
  app: {
    name: "CyberShield AI",
    version: "1.0.0",
    description: "AI-powered digital public safety platform",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
    timeout: 30000,
  },
  theme: {
    colors: {
      background: "#050508",
      surface: "#0D0D12",
      card: "#12121A",
      accent: "#EC9AA3",
      accentHover: "#F3B3BA",
      textPrimary: "#F8F8FA",
      textSecondary: "#B6B8C4",
      border: "rgba(236, 154, 163, 0.18)",
      glow: "rgba(236, 154, 163, 0.22)",
    },
  },
  navigation: {
    citizen: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Scan", href: "/scan" },
      { label: "Reports", href: "/reports" },
      { label: "Threat History", href: "/threats" },
      { label: "Settings", href: "/settings" },
    ],
    police: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Investigations", href: "/investigations" },
      { label: "Evidence", href: "/evidence" },
      { label: "Fraud Network", href: "/network" },
      { label: "Analytics", href: "/analytics" },
      { label: "Settings", href: "/settings" },
    ],
  },
} as const;
