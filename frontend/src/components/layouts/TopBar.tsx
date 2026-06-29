"use client";

interface TopBarProps {
  role: "citizen" | "police" | "organization";
}

const roleLabels = {
  citizen: "Citizen Portal",
  police: "Police Command",
  organization: "Organization",
};

export function TopBar({ role }: TopBarProps) {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-[rgba(236,154,163,0.06)] bg-[#0D0D12]/30 backdrop-blur-sm">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B6B8C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Search threats, reports, investigations..."
          className="flex-1 bg-transparent text-sm text-[#F8F8FA] placeholder:text-[#B6B8C4]/40 outline-none"
          aria-label="Search"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* AEGIS status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A]/50 border border-[rgba(236,154,163,0.08)]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-[#B6B8C4]">AEGIS Active</span>
        </div>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[#B6B8C4] hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.04)] transition-colors"
          aria-label="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EC9AA3]" />
        </button>

        {/* User avatar */}
        <button
          className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-lg hover:bg-[rgba(236,154,163,0.04)] transition-colors"
          aria-label="User menu"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-[#F8F8FA]">User</p>
            <p className="text-[10px] text-[#B6B8C4]">{roleLabels[role]}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EC9AA3]/20 to-[#F3B3BA]/10 border border-[rgba(236,154,163,0.15)] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#EC9AA3]">U</span>
          </div>
        </button>
      </div>
    </header>
  );
}
