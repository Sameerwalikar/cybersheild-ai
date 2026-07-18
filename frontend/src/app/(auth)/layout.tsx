import type { Metadata } from "next";
import { Suspense } from "react";
import AuthLayoutContent from "@/components/layouts/AuthLayout";

export const metadata: Metadata = {
  title: "Sign In — CyberShield AI",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthLayoutContent>
      <Suspense fallback={<div className="w-8 h-8 rounded-full border-2 border-[#EC9AA3] border-t-transparent animate-spin" />}>
        {children}
      </Suspense>
    </AuthLayoutContent>
  );
}
