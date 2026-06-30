"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  role: "citizen" | "police" | "organization";
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const citizenNav: NavItem[] = [
  { label: "Dashboard", href: "/citizen-dashboard", icon: <HomeIcon /> },
  { label: "Threat Scanner", href: "/scan", icon: <ScanIcon /> },
  { label: "Evidence", href: "/my-evidence", icon: <FileIcon /> },
  { label: "History", href: "/threats", icon: <ClockIcon /> },
  { label: "Reports", href: "/reports", icon: <FileIcon /> },
  { label: "AEGIS", href: "/aegis", icon: <BotIcon /> },
  { label: "Settings", href: "/citizen-settings", icon: <GearIcon /> },
];

const policeNav: NavItem[] = [
  { label: "Dashboard", href: "/police-dashboard", icon: <HomeIcon /> },
  { label: "Search", href: "/search", icon: <SearchIcon /> },
  { label: "Threat Map", href: "/threat-map", icon: <GraphIcon /> },
  { label: "Reports", href: "/police-reports", icon: <FileIcon /> },
  { label: "Investigations", href: "/investigations", icon: <SearchIcon /> },
  { label: "Evidence", href: "/evidence", icon: <FileIcon /> },
  { label: "Fraud Network", href: "/network", icon: <GraphIcon /> },
  { label: "Analytics", href: "/analytics", icon: <ChartIcon /> },
  { label: "Settings", href: "/police-settings", icon: <GearIcon /> },
];

const navMap = { citizen: citizenNav, police: policeNav, organization: citizenNav };

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = navMap[role];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-[rgba(236,154,163,0.08)] bg-[#0D0D12]/50 transition-[width] duration-300 ease-out ${collapsed ? "w-[68px]" : "w-60"}`}
      aria-label="Sidebar navigation"
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[rgba(236,154,163,0.06)]">
        <Link href={role === "police" ? "/police-dashboard" : "/citizen-dashboard"} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-[#050508]">CS</span>
          </div>
          {!collapsed && (
            <motion.span
              className="text-sm font-semibold text-[#F8F8FA]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              CyberShield
            </motion.span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#B6B8C4] hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.04)] transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1" aria-label="Main navigation">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <div key={item.label} className="relative group">
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-[rgba(236,154,163,0.08)] text-[#F8F8FA]"
                    : "text-[#B6B8C4] hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.04)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={`flex-shrink-0 ${isActive ? "text-[#EC9AA3]" : "text-[#EC9AA3]/50"}`}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#EC9AA3]"
                    layoutId="sidebar-active"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-md bg-[#12121A] border border-[rgba(236,154,163,0.12)] text-xs text-[#F8F8FA] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* AEGIS status footer */}
      <div className={`px-4 py-4 border-t border-[rgba(236,154,163,0.06)] ${collapsed ? "px-2 flex justify-center" : ""}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {!collapsed && <span className="text-[10px] text-[#B6B8C4]">AEGIS Active</span>}
        </div>
      </div>
    </aside>
  );
}

function HomeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>; }
function ScanIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/></svg>; }
function ClockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; }
function FileIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>; }
function BotIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h0M16 16h0"/></svg>; }
function GearIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.65.77 1.1 1.45 1.1H21a2 2 0 1 1 0 4h-.09c-.68 0-1.25.45-1.45 1.1z"/></svg>; }
function UserIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>; }
function GraphIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 9v6M9 6h6M15 18H9"/></svg>; }
function ChartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>; }
