"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { type QuickActionItem } from "../mocks";

interface QuickActionsWidgetProps {
  actions: QuickActionItem[];
}

const icons: Record<string, React.ReactNode> = {
  message: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  qr: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><path d="M14 14h3v3h-3zM20 14v3h-3M14 20h3M20 20h0"/></svg>,
  upi: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  mic: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>,
  alert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
};

export function QuickActionsWidget({ actions }: QuickActionsWidgetProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {actions.map((action, i) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 0.03, 0.26, 1] }}
        >
          <Link
            href={action.href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#12121A]/50 border border-[rgba(236,154,163,0.06)] hover:border-[rgba(236,154,163,0.2)] hover:bg-[rgba(236,154,163,0.03)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 group"
            aria-label={`${action.label}: ${action.description}`}
          >
            <span className="text-[#EC9AA3]/50 group-hover:text-[#EC9AA3] group-hover:scale-110 transition-all duration-200">
              {icons[action.icon]}
            </span>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-[#F8F8FA] group-hover:text-[#F8F8FA]">{action.label}</p>
              <p className="text-[9px] text-[#B6B8C4]/60 mt-0.5 hidden sm:block">{action.description}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
