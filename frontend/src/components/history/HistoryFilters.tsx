"use client";

interface HistoryFiltersProps {
  riskFilter: string;
  typeFilter: string;
  sortBy: string;
  onRiskChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onSortChange: (v: string) => void;
}

const riskOptions = ["all", "safe", "low", "medium", "high", "critical"];
const typeOptions = ["all", "message", "url", "qr", "upi", "voice"];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Risk" },
  { value: "lowest", label: "Lowest Risk" },
];

export function HistoryFilters({ riskFilter, typeFilter, sortBy, onRiskChange, onTypeChange, onSortChange }: HistoryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select label="Risk" value={riskFilter} options={riskOptions} onChange={onRiskChange} />
      <Select label="Type" value={typeFilter} options={typeOptions} onChange={onTypeChange} />
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#B6B8C4] bg-[#12121A] border border-[rgba(236,154,163,0.08)] focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors appearance-none cursor-pointer"
        aria-label="Sort order"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0D0D12]">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#B6B8C4] bg-[#12121A] border border-[rgba(236,154,163,0.08)] focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors appearance-none cursor-pointer capitalize"
      aria-label={`Filter by ${label}`}
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#0D0D12] capitalize">{o === "all" ? `All ${label}s` : o}</option>
      ))}
    </select>
  );
}
