import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In — CyberShield AI",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-8 h-8 rounded-full border-2 border-[#EC9AA3] border-t-transparent animate-spin" />}>
        {children}
      </Suspense>
    </div>
  );
}
