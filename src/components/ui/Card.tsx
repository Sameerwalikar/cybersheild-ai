import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

const paddingStyles = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ padding = "md", className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-[#12121A]/70 backdrop-blur-sm border border-[rgba(236,154,163,0.1)] ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
