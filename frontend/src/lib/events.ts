// Simple event bus for cross-component communication (scan complete → dashboard refresh)
type EventCallback = () => void;

const listeners: Record<string, EventCallback[]> = {};

export const events = {
  on(event: string, callback: EventCallback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    return () => { listeners[event] = listeners[event].filter((cb) => cb !== callback); };
  },
  emit(event: string) {
    (listeners[event] || []).forEach((cb) => cb());
  },
};

export const EVENTS = {
  SCAN_COMPLETE: "scan_complete",
  NOTIFICATION_UPDATE: "notification_update",
};
