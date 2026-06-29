"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type NotificationItem } from "../mocks";

interface NotificationsWidgetProps {
  notifications: NotificationItem[];
}

const typeConfig = {
  alert: { color: "bg-red-400", icon: "🔴" },
  security_tip: { color: "bg-amber-400", icon: "💡" },
  update: { color: "bg-[#EC9AA3]", icon: "✨" },
};

export function NotificationsWidget({ notifications }: NotificationsWidgetProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = notifications.filter((n) => !dismissed.has(n.id));
  const unreadCount = visible.filter((n) => !n.read).length;

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  if (visible.length === 0) {
    return (
      <div className="flex items-center justify-center py-6">
        <p className="text-xs text-[#B6B8C4]/60">No new notifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <div className="px-2 py-0.5 rounded-full bg-[rgba(236,154,163,0.08)] border border-[rgba(236,154,163,0.15)]">
            <span className="text-[10px] font-bold text-[#EC9AA3] tabular-nums">{unreadCount} unread</span>
          </div>
        </div>
      )}

      {/* Notification list */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {visible.map((notification, i) => {
            const config = typeConfig[notification.type];
            return (
              <motion.div
                key={notification.id}
                className={`relative px-4 py-3 rounded-lg border transition-colors duration-200 ${
                  notification.read
                    ? "bg-[#12121A]/40 border-[rgba(236,154,163,0.04)]"
                    : "bg-[#12121A]/70 border-[rgba(236,154,163,0.1)]"
                }`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                layout
              >
                <div className="flex items-start gap-3">
                  {/* Type indicator */}
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${config.color}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-medium truncate ${notification.read ? "text-[#B6B8C4]" : "text-[#F8F8FA]"}`}>
                        {notification.title}
                      </p>
                      <span className="text-[9px] text-[#B6B8C4]/50 flex-shrink-0">{notification.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[#B6B8C4]/70 mt-0.5 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#B6B8C4]/40 hover:text-[#B6B8C4] hover:bg-[rgba(236,154,163,0.04)] transition-colors flex-shrink-0"
                    aria-label={`Dismiss notification: ${notification.title}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Unread dot */}
                {!notification.read && (
                  <div className="absolute top-3 left-1.5 w-1.5 h-1.5 rounded-full bg-[#EC9AA3]" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
