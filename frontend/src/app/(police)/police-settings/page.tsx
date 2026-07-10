"use client";

import { Suspense } from "react";
import { SettingsPage } from "@/components/settings/SettingsPage";

export default function PoliceSettingsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-xl bg-[rgba(236,154,163,0.03)] animate-pulse" />}>
      <SettingsPage role="police" />
    </Suspense>
  );
}
