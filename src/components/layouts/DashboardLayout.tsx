"use client";

import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

interface DashboardLayoutProps {
  role: "citizen" | "police" | "organization";
  children: ReactNode;
}

export function DashboardLayout({ role, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#050508]">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar role={role} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
