"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B6B8C4]/50"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by case number, category, or description..."
        aria-label="Search reports"
        className="w-full rounded-xl border border-[rgba(236,154,163,0.1)] bg-[rgba(18,18,26,0.72)] py-2.5 pl-10 pr-4 text-sm text-[#F8F8FA] placeholder:text-[#B6B8C4]/45 backdrop-blur-sm transition-colors focus:border-[rgba(236,154,163,0.32)] focus:outline-none"
      />
    </div>
  );
}
