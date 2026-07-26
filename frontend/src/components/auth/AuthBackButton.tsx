"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface AuthBackButtonProps {
  href?: string; // explicit destination; falls back to router.back()
}

export function AuthBackButton({ href }: AuthBackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) router.push(href);
    else router.back();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute top-6 left-6 z-50 flex items-center bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2 rounded-full border border-slate-700 backdrop-blur-md transition-all text-sm font-medium"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </button>
  );
}
