"use client";

export type CaseFilter = "all" | "open" | "resolved";

const FILTERS: { key: CaseFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open Cases" },
  { key: "resolved", label: "Resolved" },
];

interface CaseFiltersProps {
  value: CaseFilter;
  onChange: (value: CaseFilter) => void;
}

export function CaseFilters({ value, onChange }: CaseFiltersProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border border-[rgba(236,154,163,0.08)] bg-[rgba(18,18,26,0.55)] p-1"
      role="tablist"
      aria-label="Filter reports"
    >
      {FILTERS.map((filter) => {
        const active = value === filter.key;
        return (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(filter.key)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
              active
                ? "bg-[rgba(236,154,163,0.12)] text-[#EC9AA3] shadow-[0_0_0_1px_rgba(236,154,163,0.18)]"
                : "text-[#B6B8C4] hover:bg-[rgba(236,154,163,0.04)] hover:text-[#F8F8FA]"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
