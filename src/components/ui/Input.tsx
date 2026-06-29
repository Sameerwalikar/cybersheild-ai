import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#B6B8C4]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2.5 rounded-xl text-sm text-[#F8F8FA]
            bg-[#0D0D12] border border-[rgba(236,154,163,0.12)]
            placeholder:text-[#B6B8C4]/50
            focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:ring-1 focus:ring-[rgba(236,154,163,0.2)]
            transition-[border-color,box-shadow] duration-200
            ${error ? "border-red-400/50 focus:border-red-400" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
