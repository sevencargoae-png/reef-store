"use client";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Modal, PageHeader, Pager, Table, useApi, useErr, type Column } from "./ui";
import type { MessageKey } from "@/lib/i18n/messages";

export type FieldDef = {
  name: string; label: MessageKey; type?: "text" | "number" | "textarea" | "checkbox" | "select" | "datetime" | "time";
  options?: { value: string | number; label: string }[]; required?: boolean; step?: number; min?: number; readOnly?: boolean;
  /** convert form string → API value */
  parse?: (v: string) => unknown; half?: boolean; placeholder?: string;
};

function initial(row: Record<string, unknown> | null, fields: FieldDef[]) {
  const o: Record<string, unknown> = {};
  for (const f of fields) {
    const v = row?.[f.name];
    if (f.type === "checkbox") o[f.name] = v ?? false;
    else if (f.type === "datetime") o[f.name] = v ? new Date(v as string).toISOString().slice(0, 16) : "";
    else o[f.name] = v == null ? "" : String(v);
  }
  return o;
}

export function CrudForm({ fields, row, onSubmit, pending }: { fields: FieldDef[]; row: Record<string, unknown> | null; onSubmit: (data: Record<string, unknown>) => Promise<void>; pending: boolean }) {
  const { t } = useI18n();
  const [v, setV] = useState(() => initial(row, fields));
  const set = (k: string, x: unknown) => setV((s) => ({ ...s, [k]: x }));
  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => {
      e.preventDefault();
      const data: Record<string, unknown> = {};
      for (const f of fields) {
        if (f.readOnly) continue;
        const raw = v[f.name];
        if (f.type === "checkbox") data[f.name] = !!raw;
        else if (f.parse) data[f.name] = f.parse(String(raw ?? ""));
        else if (f.type === "number") data[f.name] = raw === "" || raw == null ? null : Number(raw);
        else if (f.type === "datetime") data[f.name] = raw ? new Date(String(raw)).toISOString() : null;
        else data[f.name] = raw === "" ? null : raw;
      }
      void onSubmit(data);
    }}>
      {fields.map((f) => (
        <div key={f.name} className={f.half === false || f.type === "textarea" ? "md:col-span-2" : ""}>
          {f.type === "checkbox" ? (
            <label className="flex items-center gap-2 py-2 text-sm font-semibold"><input type="checkbox" checked={!!v[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="accent-reef-600" />{t(f.label)}</label>
          ) : (
            <Field label={t(f.label)} required={f.required}>{(p) =>
              f.type === "select" ? <Select {...p} value={String(v[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} required={f.required} disabled={f.readOnly}><option value="">{t("common.select")}</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
              : f.type === "textarea" ? <Textarea {...p} value={String(v[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} readOnly={f.readOnly} />
              : <Input {...p} type={f.type === "number" ? "number" : f.type === "datetime" ? "datetime-local" : f.type === "time" ? "time" : "text"} step={f.step ?? (f.type === "number" ? "any" : undefined)} min={f.min} value={String(v[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} required={f.required} readOnly={f.readOnly} placeholder={f.placeholder} dir={f.type === "number" || f.type === "time" || f.type === "datetime" ? "ltr" : undefined} />
            }</Field>
          )}
        </div>
      ))}
      <div className="md:col-span-2"><Button type="submit" loading={pending}>{t("common.save")}</Button></div>
    </form>
  );
}

/** Generic list + create/edit modal + delete for simple resources backed by crudRoutes(). */
export function CrudPage<T extends { id: string }>({ title, api: base, columns, fields, canWrite, searchable, query, deletable = true, extraActions }: {
  title: string; api: string; columns: Column<T>[]; fields: FieldDef[]; canWrite: boolean; searchable?: boolean; query?: string; deletable?: boolean; extraActions?: (row: T, reload: () => void) => React.ReactNode;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const err = useErr();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const url = useMemo(() => `${base}?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ""}${query ? `&${query}` : ""}`, [base, page, q, query]);
  const { data, loading, reload } = useApi<{ items: T[]; meta: { page: number; pages: number; total: number } }>(url);
  const [editing, setEditing] = useState<T | null | "new">(null);
  const [pending, setPending] = useState(false);
  const cols: Column<T>[] = canWrite ? [...columns, { key: "_actions", title: "", className: "text-end", render: (r) => <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>{extraActions?.(r, reload)}{deletable && <Button size="sm" variant="ghost" className="text-berry" onClick={async () => { if (!confirm(t("admin.confirmDelete"))) return; try { await api(`${base}/${r.id}`, { method: "DELETE" }); toast.success(t("admin.deleted")); reload(); } catch (e) { toast.error(err(e)); } }}>{t("common.delete")}</Button>}</div> }] : columns;
  return (
    <div>
      <PageHeader title={title}>
        {searchable && <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t("admin.search")} className="!h-10 !w-56" />}
        {canWrite && <Button onClick={() => setEditing("new")}>{t("admin.new")}</Button>}
      </PageHeader>
      <Table columns={cols} rows={data?.items ?? null} loading={loading} onRow={canWrite ? (r) => setEditing(r) : undefined} />
      <Pager meta={data?.meta} onPage={setPage} />
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? t("admin.new") : t("common.edit")}>
        {editing !== null && <CrudForm key={editing === "new" ? "new" : editing.id} fields={fields} row={editing === "new" ? null : (editing as unknown as Record<string, unknown>)} pending={pending} onSubmit={async (d) => { setPending(true); try { await api(editing === "new" ? base : `${base}/${(editing as T).id}`, { method: editing === "new" ? "POST" : "PATCH", json: d }); toast.success(t("admin.saved")); setEditing(null); reload(); } catch (e) { toast.error(err(e)); } finally { setPending(false); } }} />}
      </Modal>
    </div>
  );
}
