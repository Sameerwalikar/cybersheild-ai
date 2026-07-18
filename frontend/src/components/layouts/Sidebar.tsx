"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

interface SidebarProps {
  role: "citizen" | "police" | "organization";
}
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

/* ─── Police navigation ──────────────────────────────────────────────── */
const policeNav: NavItem[] = [
  { label: "Dashboard",      href: "/police-dashboard", icon: <HomeIcon /> },
  { label: "Search",         href: "/search",            icon: <SearchIcon /> },
  { label: "Reports",        href: "/police-reports",    icon: <FileIcon /> },
  { label: "Investigations", href: "/investigations",    icon: <CaseIcon /> },
  { label: "Evidence",       href: "/evidence",          icon: <EvidenceIcon /> },
  { label: "Fraud Network",  href: "/network",           icon: <GraphIcon /> },
  { label: "Threat Map",     href: "/threat-map",        icon: <MapIcon /> },
  { label: "IP Tracing",      href: "/ip-tracing",        icon: <GlobeIcon /> },
  { label: "Analytics",      href: "/analytics",         icon: <ChartIcon /> },
  { label: "Settings",       href: "/police-settings",   icon: <GearIcon /> },
];

const citizenNav: NavItem[] = [
  { label: "Dashboard",    href: "/citizen-dashboard", icon: <HomeIcon /> },
  { label: "Threat Scanner",href: "/scan",             icon: <ScanIcon /> },
  { label: "Evidence",     href: "/my-evidence",       icon: <FileIcon /> },
  { label: "History",      href: "/threats",           icon: <ClockIcon /> },
  { label: "Reports",      href: "/reports",           icon: <FileIcon /> },
  { label: "AEGIS",        href: "/aegis",             icon: <BotIcon /> },
  { label: "Settings",     href: "/citizen-settings",  icon: <GearIcon /> },
];

const navMap = { citizen: citizenNav, police: policeNav, organization: citizenNav };

export function Sidebar({ role }: SidebarProps) {
  const pathname  = usePathname();
  const items     = navMap[role];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        border-r border-[rgba(236,154,163,0.07)]
        bg-[#08080F]/60 backdrop-blur-xl
        transition-[width] duration-300 ease-out
        ${collapsed ? "w-[68px]" : "w-[220px]"}
      `}
      aria-label="Main navigation"
    >
      {/* ── Logo + collapse ──────────────────────────────────────── */}
      <div className="flex items-center justify-between h-16 px-3.5
        border-b border-[rgba(236,154,163,0.06)]">
        <Link
          href={role === "police" ? "/police-dashboard" : "/citizen-dashboard"}
          className="flex items-center gap-2.5 min-w-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EC9AA3] to-[#e07882]
            flex items-center justify-center flex-shrink-0
            shadow-[0_2px_10px_rgba(236,154,163,0.3)]">
            <span className="text-[10px] font-black text-[#050508] tracking-tight">CS</span>
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <p className="text-[13px] font-bold text-[#F8F8FA] whitespace-nowrap leading-none">
                CyberShield
              </p>
              {role === "police" && (
                <p className="text-[8px] text-[#EC9AA3]/60 font-semibold uppercase tracking-widest mt-0.5">
                  Police Command
                </p>
              )}
            </motion.div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg flex items-center justify-center
            text-[#B6B8C4]/40 hover:text-[#B6B8C4] hover:bg-[rgba(236,154,163,0.06)]
            transition-colors flex-shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" aria-label="Pages">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <div key={item.label} className="relative group">
              <Link
                href={item.href}
                className={`
                  relative flex items-center gap-3 px-2.5 py-2.5 rounded-xl
                  text-sm transition-all duration-150
                  ${isActive
                    ? "bg-[rgba(236,154,163,0.1)] text-[#F8F8FA]"
                    : "text-[#B6B8C4]/60 hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.05)]"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-pill"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#EC9AA3]"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}

                {/* Icon */}
                <span className={`flex-shrink-0 transition-colors
                  ${isActive ? "text-[#EC9AA3]" : "text-[#EC9AA3]/35 group-hover:text-[#EC9AA3]/60"}`}>
                  {item.icon}
                </span>

                {/* Label */}
                {!collapsed && (
                  <span className="truncate font-medium text-[13px] leading-none">
                    {item.label}
                  </span>
                )}

                {/* Badge */}
                {!collapsed && item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-md text-[8px] font-bold
                    bg-red-500/20 text-red-400 flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>

              {/* Collapsed tooltip */}
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5
                  rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.12)]
                  text-xs text-[#F8F8FA] opacity-0 group-hover:opacity-100
                  pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50
                  shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── AEGIS Status Footer ───────────────────────────────────── */}
      <div className={`
        px-3.5 py-4 border-t border-[rgba(236,154,163,0.06)]
        ${collapsed ? "flex justify-center" : ""}
      `}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          {!collapsed && (
            <span className="text-[10px] text-[#B6B8C4]/50 font-medium">AEGIS Active</span>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────── */
function HomeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
}
function ScanIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /></svg>;
}
function ClockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
}
function FileIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
}
function BotIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4M8 16h0M16 16h0" /></svg>;
}
function GearIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.65.77 1.1 1.45 1.1H21a2 2 0 1 1 0 4h-.09c-.68 0-1.25.45-1.45 1.1z" /></svg>;
}
function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
}
function GraphIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><circle cx="18" cy="6" r="3" /><path d="M6 9v6M9 6h6M15 18H9" /></svg>;
}
function ChartIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>;
}
function CaseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
}
function EvidenceIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
}
function MapIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg>;
}
function GlobeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>;
}
