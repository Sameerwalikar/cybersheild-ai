"use client";

import { motion } from "framer-motion";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const columns = [
  {
    title: "Product",
    links: [
      { label: "Citizen Portal", href: "#" },
      { label: "Police Dashboard", href: "#" },
      { label: "Threat Intelligence", href: "#" },
      { label: "AI Analysis", href: "#" },
      { label: "Fraud Network", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Mission", href: "#" },
      { label: "Roadmap", href: "#" },
      { label: "Documentation", href: "#" },
      { label: "Careers", href: "#", badge: "Coming Soon" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: "#" },
      { label: "API Docs", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "LinkedIn", href: "#" },
      { label: "X", href: "#" },
      { label: "Email", href: "#" },
      { label: "Demo Video", href: "#" },
    ],
  },
];

export function PremiumFooter() {
  return (
    <footer className="relative w-full border-t border-[rgba(236,154,163,0.08)]" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Footer columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {columns.map((col, colIdx) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: colIdx * 0.08, ease }}
            >
              <h3 className="text-xs font-bold text-[#F8F8FA] uppercase tracking-wider mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5" role="list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[#B6B8C4] hover:text-[#F3B3BA] transition-colors duration-150 inline-flex items-center gap-2"
                    >
                      {link.label}
                      {"badge" in link && link.badge && (
                        <span className="text-[8px] font-bold text-[#EC9AA3] uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-[rgba(236,154,163,0.2)] bg-[rgba(236,154,163,0.05)]">
                          {link.badge}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-14 pt-6 border-t border-[rgba(236,154,163,0.06)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Logo + copyright */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center">
                <span className="text-[9px] font-bold text-[#050508]">CS</span>
              </div>
              <div>
                <p className="text-xs text-[#B6B8C4]">
                  © 2026 CyberShield AI
                </p>
              </div>
            </div>

            {/* Center: Built with love */}
            <p className="text-xs text-[#B6B8C4]/70 text-center">
              Built with <span className="text-[#EC9AA3]">❤️</span> for a safer digital India.
            </p>

            {/* Right: Version */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#B6B8C4]/50 font-mono">
                v1
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
