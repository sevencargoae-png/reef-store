"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import { useFmt } from "@/lib/use-format";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Badge, Modal, PageHeader, Pager, Stat, Table, useApi, useErr } from "./ui";
import { ROLE_PERMISSIONS, PERMISSIONS, STAFF_ROLES } from "@/lib/rbac";
import type { StoreSettings } from "@/lib/settings";
import type { MessageKey } from "@/lib/i18n/messages";
import { addDays, uaeToday } from "@/lib/dates";

// ───────── Subscriptions ─────────
interface Sub { id: string; name: string; status: string; frequency: string; weekday: number; nextRunAt: string; user: { id: string; name: string; phone: string }; slot: string | null; area: string; ordersCount: number; items: { nameAr: string; nameEn: string; unit: string; qty: number }[] }
export function SubscriptionsAdmin({ canWrite }: { canWrite: boolean }) {
  const { t } = useI18n(); const L = useLocalized(); const { qty, date } = useFmt(); const toast = useToast(); const err = useErr();
  const [page, setPage] = useState(1); const [status, setStatus] = useState("ACTIVE");
  const { data, loading, reload } = useApi<{ items: Sub[]; meta: { page: number; pages: number; total: number } }>(`/api/admin/subscriptions?page=${page}&status=${status}`);
  const [running, setRunning] = useState(false);
  const T = (k: string) => t(k as MessageKey);
  return (
    <div>
      <PageHeader title={t("admin.subscriptions")}>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="!h-10 !w-40 !py-1"><option value="">{t("common.all")}</option>{["ACTIVE", "PAUSED", "CANCELLED"].map((s) => <option key={s} value={s}>{T(`subs.status.${s}`)}</option>)}</Select>
        {canWrite && <Button loading={running} onClick={async () => { setRunning(true); try { const r = await api<{ orderId?: string }[]>("/api/admin/subscriptions/run", { method: "POST" }); toast.success(t("subs.ran", { count: r.filter((x) => x.orderId).length })); reload(); } catch (e) { toast.error(err(e)); } finally { setRunning(false); } }}>{t("subs.run")}</Button>}
      </PageHeader>
      <Table<Sub> rows={data?.items ?? null} loading={loading} columns={[
        { key: "name", title: t("f.name"), render: (s) => <div><b>{s.name}</b><div className="text-xs text-muted">{T(`subs.${s.frequency}`)} · {T(`weekday.${s.weekday}`)}{s.slot && ` · ${s.slot}`} · {s.area}</div></div> },
        { key: "user", title: t("subs.customer"), render: (s) => <Link href={`/admin/customers/${s.user.id}`} className="text-reef-700">{s.user.name}<div className="num text-xs text-muted">{s.user.phone}</div></Link> },
        { key: "items", title: t("cart.items", { count: 0 }).replace("0", ""), hideBelow: "lg", render: (s) => <span className="text-xs text-muted">{s.items.map((i) => `${L(i, "name")} ${qty(i.qty, i.unit)}`).join("، ")}</span> },
        { key: "next", title: t("subs.next"), render: (s) => <span className="num text-xs">{date(s.nextRunAt + "T00:00:00Z")}</span> },
        { key: "status", title: t("common.status"), render: (s) => <Badge tone={s.status === "ACTIVE" ? "good" : s.status === "PAUSED" ? "warn" : "neutral"}>{T(`subs.status.${s.status}`)}</Badge> },
        ...(canWrite ? [{ key: "_a", title: "", className: "text-end", render: (s: Sub) => <div className="flex justify-end gap-1">{s.status === "ACTIVE" && <Button size="sm" variant="ghost" onClick={async () => { await api(`/api/admin/subscriptions/${s.id}`, { method: "PATCH", json: { status: "PAUSED" } }); reload(); }}>{t("subs.pause")}</Button>}{s.status === "PAUSED" && <Button size="sm" variant="secondary" onClick={async () => { await api(`/api/admin/subscriptions/${s.id}`, { method: "PATCH", json: { status: "ACTIVE" } }); reload(); }}>{t("subs.resume")}</Button>}{s.status !== "CANCELLED" && <Button size="sm" variant="ghost" className="text-berry" onClick={async () => { await api(`/api/admin/subscriptions/${s.id}`, { method: "PATCH", json: { status: "CANCELLED" } }); reload(); }}>{t("subs.cancel")}</Button>}</div> }] : []),
      ]} />
      <Pager meta={data?.meta} onPage={setPage} />
    </div>
  );
}

// ───────── Reports ─────────
interface Report { from: string; to: string; orders: number; delivered: number; revenue: number; cogs: number; delivery: number; discount: number; vat: number; profit: number; avgOrder: number; byDay: { day: string; orders: number; revenue: number; cogs: number }[]; byStatus: Record<string, number>; byArea: { area: string; orders: number; revenue: number }[]; topProducts: { nameAr: string; nameEn: string; unit: string; qty: number; revenue: number }[] }
export function ReportsAdmin() {
  const { t } = useI18n(); const L = useLocalized(); const { money, qty } = useFmt();
  const [to, setTo] = useState(uaeToday()); const [from, setFrom] = useState(addDays(uaeToday(), -29));
  const url = useMemo(() => `/api/admin/reports?from=${from}&to=${to}`, [from, to]);
  const { data: r } = useApi<Report>(url);
  const max = Math.max(1, ...(r?.byDay.map((d) => d.revenue) ?? [0]));
  return (
    <div>
      <PageHeader title={t("admin.reports")}>
        <label className="text-sm">{t("reports.from")} <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!inline !h-10 !w-40" dir="ltr" /></label>
        <label className="text-sm">{t("reports.to")} <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!inline !h-10 !w-40" dir="ltr" /></label>
        <a href={`${url}&format=csv`} className="rounded-full border border-reef-200 bg-white px-4 py-2 text-sm font-semibold">{t("reports.export")}</a>
      </PageHeader>
      <p className="mb-3 text-xs text-muted">{t("reports.note")}</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label={t("reports.orders")} value={r?.orders ?? "—"} sub={r ? `${t("reports.delivered")}: ${r.delivered}` : undefined} />
        <Stat label={t("reports.revenue")} value={r ? money(r.revenue) : "—"} />
        <Stat label={t("reports.cogs")} value={r ? money(r.cogs) : "—"} />
        <Stat label={t("reports.profit")} value={r ? money(r.profit) : "—"} />
        <Stat label={t("reports.avgOrder")} value={r ? money(r.avgOrder) : "—"} />
        <Stat label={t("cart.discount")} value={r ? money(r.discount) : "—"} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-3 font-extrabold">{t("reports.byDay")}</h2>
          {r && !r.byDay.length && <p className="text-sm text-muted">{t("common.noData")}</p>}
          <div className="flex h-44 items-end gap-1" dir="ltr">{r?.byDay.map((d) => <div key={d.day} title={`${d.day}: ${money(d.revenue)} (${d.orders})`} className="flex-1 rounded-t bg-reef-500 hover:bg-reef-700" style={{ height: `${Math.max(3, (d.revenue / max) * 100)}%` }} />)}</div>
          <div className="mt-1 flex justify-between text-[10px] text-muted" dir="ltr"><span>{r?.byDay[0]?.day}</span><span>{r?.byDay.at(-1)?.day}</span></div>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-2 font-extrabold">{t("reports.topProducts")}</h2>
          <table className="w-full text-sm"><tbody>{r?.topProducts.map((p) => <tr key={p.nameAr} className="border-t border-reef-50"><td className="py-1.5">{L(p, "name")}</td><td className="num text-muted">{qty(p.qty, p.unit)}</td><td className="num text-end font-semibold">{money(p.revenue)}</td></tr>)}</tbody></table>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-2 font-extrabold">{t("reports.byStatus")}</h2>
          <ul className="space-y-1 text-sm">{r && Object.entries(r.byStatus).map(([s, n]) => <li key={s} className="flex justify-between"><span>{t(`orderStatus.${s}` as MessageKey)}</span><b className="num">{n}</b></li>)}</ul>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-2 font-extrabold">{t("reports.byArea")}</h2>
          <ul className="space-y-1 text-sm">{r?.byArea.map((a) => <li key={a.area} className="flex justify-between"><span>{a.area} <span className="num text-muted">({a.orders})</span></span><b className="num">{money(a.revenue)}</b></li>)}</ul>
        </section>
      </div>
    </div>
  );
}

// ───────── Users ─────────
interface StaffRow { id: string; name: string; phone: string; email: string | null; role: string; status: string; createdAt: string; mustChangePassword: boolean; _count: { sessions: number } }
export function UsersAdmin({ meId }: { meId: string }) {
  const { t } = useI18n(); const toast = useToast(); const err = useErr(); const { dateTime } = useFmt();
  const { data, loading, reload } = useApi<{ items: StaffRow[] }>("/api/admin/users");
  const [open, setOpen] = useState(false); const [temp, setTemp] = useState<{ phone: string; tempPassword: string } | null>(null); const [pending, setPending] = useState(false);
  const R = (r: string) => t(`role.${r}` as MessageKey);
  return (
    <div>
      <PageHeader title={t("admin.users")}><Button onClick={() => setOpen(true)}>{t("users.create")}</Button></PageHeader>
      <Table<StaffRow> rows={data?.items ?? null} loading={loading} columns={[
        { key: "name", title: t("f.name"), render: (r) => <div><b>{r.name}</b><div className="num text-xs text-muted">{r.phone}</div></div> },
        { key: "role", title: t("f.role"), render: (r) => <Select value={r.role} disabled={r.id === meId} className="!w-40 !py-1" onChange={async (e) => { try { await api(`/api/admin/users/${r.id}`, { method: "PATCH", json: { role: e.target.value } }); toast.success(t("admin.saved")); reload(); } catch (ex) { toast.error(err(ex)); } }}>{STAFF_ROLES.map((x) => <option key={x} value={x}>{R(x)}</option>)}</Select> },
        { key: "status", title: t("f.status"), render: (r) => <Badge tone={r.status === "ACTIVE" ? "good" : "bad"}>{t(`userStatus.${r.status}` as MessageKey)}</Badge> },
        { key: "created", title: t("f.createdAt"), hideBelow: "lg", render: (r) => <span className="num text-xs">{dateTime(r.createdAt)}</span> },
        { key: "_a", title: "", className: "text-end", render: (r) => <div className="flex justify-end gap-1">
          {r.id !== meId && <Button size="sm" variant="ghost" onClick={async () => { try { await api(`/api/admin/users/${r.id}`, { method: "PATCH", json: { status: r.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" } }); reload(); } catch (ex) { toast.error(err(ex)); } }}>{r.status === "ACTIVE" ? t("customers.suspend") : t("customers.activate")}</Button>}
          <Button size="sm" variant="ghost" onClick={async () => { try { const x = await api<{ tempPassword: string }>(`/api/admin/users/${r.id}/password`, { method: "POST" }); setTemp({ phone: r.phone, tempPassword: x.tempPassword }); } catch (ex) { toast.error(err(ex)); } }}>{t("users.resetPassword")}</Button>
          <Button size="sm" variant="ghost" onClick={async () => { await api(`/api/admin/users/${r.id}/sessions`, { method: "DELETE" }); toast.success(t("admin.saved")); }}>{t("users.revokeSessions")}</Button>
        </div> },
      ]} />
      <section className="mt-8 rounded-2xl bg-white p-4 shadow-card">
        <h2 className="mb-2 font-extrabold">{t("users.permissions")}</h2>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className="py-1 text-start"></th>{STAFF_ROLES.map((r) => <th key={r} className="px-2 py-1 text-start">{R(r)}</th>)}</tr></thead><tbody>{PERMISSIONS.map((p) => <tr key={p} className="border-t border-reef-50"><td className="py-1 font-semibold">{t(`perm.${p}` as MessageKey)}</td>{STAFF_ROLES.map((r) => <td key={r} className="px-2 py-1">{ROLE_PERMISSIONS[r].includes(p) ? "✓" : "—"}</td>)}</tr>)}</tbody></table></div>
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title={t("users.create")}>
        <form className="grid gap-3" onSubmit={async (e) => { e.preventDefault(); setPending(true); const fd = new FormData(e.currentTarget); try { const r = await api<{ phone: string; tempPassword: string }>("/api/admin/users", { method: "POST", json: { name: fd.get("name"), phone: fd.get("phone"), email: fd.get("email") || "", role: fd.get("role") } }); setOpen(false); setTemp(r); reload(); } catch (ex) { toast.error(err(ex)); } finally { setPending(false); } }}>
          <Field label={t("f.name")} required>{(p) => <Input {...p} name="name" required />}</Field>
          <Field label={t("f.phone")} required>{(p) => <Input {...p} name="phone" type="tel" dir="ltr" required />}</Field>
          <Field label={t("f.email")}>{(p) => <Input {...p} name="email" type="email" dir="ltr" />}</Field>
          <Field label={t("f.role")}>{(p) => <Select {...p} name="role" defaultValue="OPERATIONS">{STAFF_ROLES.map((x) => <option key={x} value={x}>{R(x)}</option>)}</Select>}</Field>
          <Button type="submit" loading={pending}>{t("common.save")}</Button>
        </form>
      </Modal>
      <Modal open={!!temp} onClose={() => setTemp(null)} title={t("f.tempPassword")}>
        {temp && <div className="space-y-3"><p className="rounded-xl bg-sun/15 px-3 py-2 text-sm">{t("users.tempPasswordNotice")}</p><div className="num rounded-xl bg-mint-50 p-3 text-center text-lg font-bold" dir="ltr">{temp.phone} / {temp.tempPassword}</div><Button onClick={() => { navigator.clipboard?.writeText(temp.tempPassword); toast.success(t("admin.saved")); }}>Copy</Button></div>}
      </Modal>
    </div>
  );
}

// ───────── Audit ─────────
interface AuditRow { id: string; action: string; entity: string; entityId: string | null; before: unknown; after: unknown; ip: string | null; createdAt: string; user: { name: string; role: string } | null }
export function AuditAdmin() {
  const { t } = useI18n(); const { dateTime } = useFmt();
  const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const { data, loading } = useApi<{ items: AuditRow[]; meta: { page: number; pages: number; total: number } }>(`/api/admin/audit?page=${page}&q=${encodeURIComponent(q)}`);
  const [row, setRow] = useState<AuditRow | null>(null);
  return (
    <div>
      <PageHeader title={t("admin.audit")}><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t("admin.search")} className="!h-10 !w-56" /></PageHeader>
      <Table<AuditRow> rows={data?.items ?? null} loading={loading} onRow={setRow} columns={[
        { key: "when", title: t("audit.when"), render: (r) => <span className="num text-xs">{dateTime(r.createdAt)}</span> },
        { key: "by", title: t("audit.by"), render: (r) => r.user ? <span>{r.user.name} <span className="text-xs text-muted">({t(`role.${r.user.role}` as MessageKey)})</span></span> : "—" },
        { key: "action", title: t("audit.action"), render: (r) => <span className="num font-semibold">{r.action}</span> },
        { key: "entity", title: t("audit.entity"), hideBelow: "md", render: (r) => <span className="num text-xs text-muted">{r.entity} {r.entityId ?? ""}</span> },
        { key: "ip", title: "IP", hideBelow: "lg", render: (r) => <span className="num text-xs text-muted">{r.ip ?? ""}</span> },
      ]} />
      <Pager meta={data?.meta} onPage={setPage} />
      <Modal open={!!row} onClose={() => setRow(null)} title={t("audit.details")} wide>{row && <pre className="max-h-[60dvh] overflow-auto rounded-xl bg-mint-50 p-3 text-xs" dir="ltr">{JSON.stringify({ before: row.before, after: row.after }, null, 2)}</pre>}</Modal>
    </div>
  );
}

// ───────── Settings ─────────
export function SettingsAdmin({ initial }: { initial: StoreSettings }) {
  const { t } = useI18n(); const toast = useToast(); const err = useErr();
  const [s, setS] = useState(initial); const [pending, setPending] = useState(false);
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const txt = (k: keyof StoreSettings, label: MessageKey, dir?: "ltr") => <Field label={t(label)}>{(p) => <Input {...p} value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} dir={dir} />}</Field>;
  const num = (k: keyof StoreSettings, label: MessageKey, step = 1) => <Field label={t(label)}>{(p) => <Input {...p} type="number" step={step} min={0} dir="ltr" value={String(s[k])} onChange={(e) => set(k, Number(e.target.value) as never)} />}</Field>;
  const chk = (k: keyof StoreSettings, label: MessageKey) => <label className="flex items-center gap-2 py-2 text-sm font-semibold"><input type="checkbox" checked={!!s[k]} onChange={(e) => set(k, e.target.checked as never)} className="accent-reef-600" />{t(label)}</label>;
  return (
    <form className="max-w-3xl space-y-6" onSubmit={async (e) => { e.preventDefault(); setPending(true); try { setS(await api<StoreSettings>("/api/admin/settings", { method: "PATCH", json: s })); toast.success(t("admin.saved")); } catch (ex) { toast.error(err(ex)); } finally { setPending(false); } }}>
      <PageHeader title={t("admin.settings")} />
      <section className="grid gap-3 rounded-2xl bg-white p-4 shadow-card md:grid-cols-2"><h2 className="font-extrabold md:col-span-2">{t("settings.store")}</h2>{txt("storeNameAr", "f.nameAr")}{txt("storeNameEn", "f.nameEn", "ltr")}{txt("supportPhone", "settings.supportPhone", "ltr")}{txt("supportWhatsapp", "settings.supportWhatsapp", "ltr")}{txt("deliveryPromiseAr", "settings.deliveryPromiseAr")}{txt("deliveryPromiseEn", "settings.deliveryPromiseEn", "ltr")}</section>
      <section className="grid gap-3 rounded-2xl bg-white p-4 shadow-card md:grid-cols-2"><h2 className="font-extrabold md:col-span-2">{t("settings.vat")}</h2><p className="text-xs text-muted md:col-span-2">{t("settings.vatNote")}</p>{chk("vatEnabled", "settings.vatEnabled")}{chk("pricesIncludeVat", "settings.pricesIncludeVat")}{num("vatRate", "settings.vatRate", 0.01)}</section>
      <section className="grid gap-3 rounded-2xl bg-white p-4 shadow-card md:grid-cols-2"><h2 className="font-extrabold md:col-span-2">{t("admin.orders")}</h2>{chk("codEnabled", "settings.codEnabled")}{num("minOrderAed", "settings.minOrder")}{num("bookingWindowDays", "settings.bookingWindowDays")}</section>
      <Button type="submit" loading={pending}>{t("common.save")}</Button>
    </form>
  );
}
