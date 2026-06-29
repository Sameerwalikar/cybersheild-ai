"use client";

interface ScanButtonProps {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function ScanButton({ label = "Analyze", loading = false, disabled = false, onClick }: ScanButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-sm text-[#050508] bg-[#EC9AA3] shadow-[0_2px_12px_rgba(236,154,163,0.2)] hover:shadow-[0_6px_20px_rgba(236,154,163,0.25)] hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2"
      aria-label={loading ? "Scanning..." : label}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {loading ? "Scanning..." : label}
    </button>
  );
}
