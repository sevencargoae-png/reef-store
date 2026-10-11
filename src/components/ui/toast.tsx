"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { cx } from "./cx";

interface Toast { id: number; kind: "success" | "error" | "info"; text: string }
const Ctx = createContext<{ push: (kind: Toast["kind"], text: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, kind, text }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx("fade-up pointer-events-auto rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-soft", t.kind === "success" ? "bg-reef-700" : t.kind === "error" ? "bg-berry" : "bg-ink")}>{t.text}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast outside provider");
  return { success: (t: string) => c.push("success", t), error: (t: string) => c.push("error", t), info: (t: string) => c.push("info", t) };
}
