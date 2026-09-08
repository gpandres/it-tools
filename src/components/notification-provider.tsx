"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Notification = { id: number; message: string; tone: "info" | "error" };
type NotificationContextValue = { notify: (message: string, tone?: Notification["tone"]) => void };
const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());
  const notify = useCallback((message: string, tone: Notification["tone"] = "info") => {
    const id = nextId.current += 1;
    setNotifications(current => [...current.slice(-2), { id, message, tone }]);
    const timer = window.setTimeout(() => {
      timers.current.delete(id);
      setNotifications(current => current.filter(item => item.id !== id));
    }, 4500);
    timers.current.set(id, timer);
  }, []);
  const dismiss = (id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
    setNotifications(current => current.filter(item => item.id !== id));
  };
  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message?: unknown) => notify(String(message ?? "Notification"), "error");
    const activeTimers = timers.current;
    return () => {
      window.alert = nativeAlert;
      activeTimers.forEach(timer => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, [notify]);

  return <NotificationContext.Provider value={{ notify }}>
    {children}
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-label="Notifications">
      {notifications.map(item => <div key={item.id} role="status" className={`pointer-events-auto flex items-start gap-3 border bg-[#080808]/95 px-3 py-2 text-xs shadow-xl ${item.tone === "error" ? "border-[#8f2435] text-[#ff9aa9]" : "border-[#176b52] text-[#9fffd1]"}`}>
        <span className="flex-1">{item.message}</span><button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification" className="text-zinc-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
      </div>)}
    </div>
  </NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used inside NotificationProvider");
  return context;
}
