"use client";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { api, ApiError } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/components/ui/cx";
import { Button } from "@/components/ui/button";
import type { MessageKey } from "@/lib/i18n/messages";

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try { setData(await api<T>(path)); setError(null); } catch (e) { setError(e instanceof ApiError ? e.code : "INTERNAL"); } finally { setLoading(false); }
  }, [path]);
  // deferred so the effect itself does not call setState synchronously (react-hooks/set-state-in-effect)
  useEffect(() => { const t = setTimeout(() => void reload(), 0); return () => clearTimeout(t); }, [reload]);
  return { data, error, loading, reload, setData };
}

export function useErr() {
  const { t } = useI18n();
  return (e: unknown) => (e instanceof ApiError ? (e.details?.length ? `${t(`error.${e.code}` as MessageKey)}: ${e.details.map((d) => `${d.path} ${d.message}`).join("، ")}` : t(`error.${e.code}` as MessageKey)) : t("common.error"));
}

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-extrabold text-reef-800">{title}</h1><div className="ms-auto flex flex-wrap items-center gap-2">{children}</div></div>;
}

export interface Column<T> { key: string; title: string; render?: (row: T) => React.ReactNode; className?: string; hideBelow?: "md" | "lg" }
export function Table<T extends { id: string }>({ columns, rows, loading, onRow, empty }: { columns: Column<T>[]; rows: T[] | null; loading?: boolean; onRow?: (r: T) => void; empty?: string }) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-reef-100 text-xs text-muted">{columns.map((c) => <th key={c.key} className={cx("px-3 py-2.5 text-start font-semibold", c.hideBelow === "md" && "hidden md:table-cell", c.hideBelow === "lg" && "hidden lg:table-cell", c.className)}>{c.title}</th>)}</tr></thead>
        <tbody>
          {loading && !rows?.length && <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-muted">{t("common.loading")}</td></tr>}
          {!loading && rows && !rows.length && <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-muted">{empty ?? t("common.noData")}</td></tr>}
          {rows?.map((r) => <tr key={r.id} onClick={onRow ? () => onRow(r) : undefined} className={cx("border-b border-reef-50 last:border-0", onRow && "cursor-pointer hover:bg-mint-50/60")}>{columns.map((c) => <td key={c.key} className={cx("px-3 py-2 align-middle", c.hideBelow === "md" && "hidden md:table-cell", c.hideBelow === "lg" && "hidden lg:table-cell", c.className)}>{c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "")}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ meta, onPage }: { meta: { page: number; pages: number; total: number } | undefined; onPage: (p: number) => void }) {
  const { t } = useI18n();
  if (!meta || meta.pages <= 1) return null;
  return <div className="mt-3 flex items-center justify-center gap-3 text-sm"><Button size="sm" variant="outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>{t("common.prev")}</Button><span className="num text-muted">{t("common.page", { page: meta.page, pages: meta.pages })}</span><Button size="sm" variant="outline" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>{t("common.next")}</Button></div>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => { if (!open) return; const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-6" onClick={onClose} role="dialog" aria-modal>
      <div className={cx("max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-soft md:rounded-3xl", wide ? "md:max-w-4xl" : "md:max-w-xl")} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold text-reef-800">{title}</h2><button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-mint-100" aria-label="close"><X className="h-5 w-5" /></button></div>
        {children}
      </div>
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "info" }) {
  const c = { neutral: "bg-gray-100 text-gray-700", good: "bg-mint-100 text-reef-800", warn: "bg-sun/20 text-amber-800", bad: "bg-red-50 text-berry", info: "bg-blue-50 text-blue-800" }[tone];
  return <span className={cx("inline-block rounded-full px-2 py-0.5 text-xs font-bold", c)}>{children}</span>;
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return <div className="rounded-2xl bg-white p-4 shadow-card"><div className="text-xs font-semibold text-muted">{label}</div><div className="num mt-1 text-2xl font-extrabold text-reef-800">{value}</div>{sub && <div className="text-xs text-muted">{sub}</div>}</div>;
}
