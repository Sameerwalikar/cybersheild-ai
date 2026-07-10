"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

interface TopBarProps {
  role: "citizen" | "police" | "organization";
}

const roleLabel: Record<string, string> = {
  citizen:      "Citizen Portal",
  police:       "Police Command",
  organization: "Organization",
};

export function TopBar({ role }: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [query, setQuery]       = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropPos, setDropPos]   = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);
  const [mounted, setMounted]   = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const openMenu = useCallback(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setMenuOpen(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(t) &&
        triggerRef.current && !triggerRef.current.contains(t)
      ) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [menuOpen]);

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim().length >= 2 && role === "police") {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, role, router]);

  const handleLogout = useCallback(() => {
    logout(); setMenuOpen(false); router.push("/select-role");
  }, [logout, router]);

  const settingsHref  = role === "police" ? "/police-settings" : "/citizen-settings";
  const displayName   = user?.name ?? "Officer";
  const displayEmail  = user?.email ?? "";
  const initials      = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <>
      <header
        className="flex items-center justify-between h-14 px-5
          border-b border-[rgba(236,154,163,0.06)]
          bg-[#08080F]/50 backdrop-blur-xl relative z-10"
      >
        {/* Search ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 flex-1 max-w-[440px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B6B8C4"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search" value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder={role === "police"
              ? "Search threats, reports, investigations, UPI, phones…"
              : "Search scans, history, reports…"
            }
            className="flex-1 bg-transparent text-[13px] text-[#F8F8FA]
              placeholder:text-[#B6B8C4]/35 outline-none min-w-0"
            aria-label="Global search"
          />
          {query && role === "police" && (
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
              bg-[rgba(236,154,163,0.06)] border border-[rgba(236,154,163,0.1)]
              text-[9px] text-[#B6B8C4]/50 flex-shrink-0">
              ↵
            </kbd>
          )}
        </div>

        {/* Right controls ──────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* AEGIS status */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg
            bg-[#12121A]/50 border border-[rgba(236,154,163,0.07)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[9px] text-[#B6B8C4]/60 font-medium">AEGIS Active</span>
          </div>

          {/* Notifications bell */}
          <button
            className="relative w-8 h-8 rounded-lg flex items-center justify-center
              text-[#B6B8C4]/50 hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.05)]
              transition-colors"
            aria-label="Notifications"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#EC9AA3]" />
          </button>

          {/* User avatar button */}
          <button
            ref={triggerRef}
            onClick={() => menuOpen ? setMenuOpen(false) : openMenu()}
            className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-xl
              hover:bg-[rgba(236,154,163,0.05)] border border-transparent
              hover:border-[rgba(236,154,163,0.08)] transition-all duration-150"
            aria-label="User menu" aria-expanded={menuOpen}
          >
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-semibold text-[#F8F8FA] leading-tight">{displayName}</p>
              <p className="text-[9px] text-[#B6B8C4]/55 leading-tight">{roleLabel[role]}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EC9AA3] to-[#e07882]
              flex items-center justify-center
              shadow-[0_2px_8px_rgba(236,154,163,0.25)] flex-shrink-0">
              <span className="text-[10px] font-black text-[#050508]">{initials}</span>
            </div>
          </button>
        </div>
      </header>

      {/* Dropdown portal ─────────────────────────────────────────── */}
      {mounted && menuOpen && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: dropPos.top, right: dropPos.right, zIndex: 9999 }}
          className="w-64 rounded-2xl bg-[#0D0D14] border border-[rgba(236,154,163,0.12)]
            shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden"
        >
          {/* User info */}
          <div className="px-4 py-3.5 border-b border-[rgba(236,154,163,0.07)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EC9AA3] to-[#e07882]
                flex items-center justify-center flex-shrink-0
                shadow-[0_2px_8px_rgba(236,154,163,0.25)]">
                <span className="text-sm font-black text-[#050508]">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F8F8FA] truncate">{displayName}</p>
                <p className="text-[10px] text-[#B6B8C4]/55 truncate">{displayEmail}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider
                bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.15)]">
                {role}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-semibold
                bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                Active
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <DItem icon={<SettingsIcon />} label="Settings" hint="Preferences & account"
              onClick={() => { setMenuOpen(false); router.push(settingsHref); }} />
            <DItem icon={<ProfileIcon />} label="Profile" hint="View your profile"
              onClick={() => { setMenuOpen(false); router.push(settingsHref + "?tab=profile"); }} />
            <DItem icon={<ShieldIcon />} label="Security" hint="Password & sessions"
              onClick={() => { setMenuOpen(false); router.push(settingsHref + "?tab=security"); }} />
          </div>

          {/* Logout */}
          <div className="p-1.5 border-t border-[rgba(236,154,163,0.06)]">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-left hover:bg-red-500/10 group transition-colors duration-150">
              <span className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center
                text-red-400 group-hover:bg-red-500/15 transition-colors">
                <LogoutIcon />
              </span>
              <div>
                <p className="text-xs font-semibold text-red-400">Sign out</p>
                <p className="text-[9px] text-[#B6B8C4]/40">Return to role selection</p>
              </div>
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function DItem({ icon, label, hint, onClick }: {
  icon: React.ReactNode; label: string; hint: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        text-left hover:bg-[rgba(236,154,163,0.05)] group transition-colors duration-150">
      <span className="w-7 h-7 rounded-lg bg-[rgba(236,154,163,0.06)] flex items-center justify-center
        text-[#EC9AA3]/50 group-hover:text-[#EC9AA3] group-hover:bg-[rgba(236,154,163,0.1)]
        transition-colors">
        {icon}
      </span>
      <div>
        <p className="text-xs font-medium text-[#F8F8FA]">{label}</p>
        <p className="text-[9px] text-[#B6B8C4]/45">{hint}</p>
      </div>
    </button>
  );
}

function SettingsIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function ProfileIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function ShieldIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>; }
function LogoutIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
