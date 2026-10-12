"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useFmt } from "@/lib/use-format";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Badge, PageHeader, Pager, Table, useApi, useErr } from "./ui";
import { StatusBadge } from "@/components/store/account-views";
import type { OrderDTO } from "@/lib/services/orders";
import type { MessageKey } from "@/lib/i18n/messages";

interface Row { id: string; name: string; phone: string; email: string | null; status: string; createdAt: string; ordersCount: number; totalSpent: number; lastOrderAt: string | null }

export function CustomersList() {
  const { t } = useI18n(); const { money, date } = useFmt();
  const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const url = useMemo(() => `/api/admin/customers?page=${page}&q=${encodeURIComponent(q)}`, [page, q]);
  const { data, loading } = useApi<{ items: Row[]; meta: { page: number; pages: number; total: number } }>(url);
  return (
    <div>
      <PageHeader title={t("admin.customers")}><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t("admin.search")} className="!h-10 !w-56" /></PageHeader>
      <Table<Row> rows={data?.items ?? null} loading={loading} columns={[
        { key: "name", title: t("common.name"), render: (r) => <Link href={`/admin/customers/${r.id}`} className="font-bold text-reef-700">{r.name}</Link> },
        { key: "phone", title: t("common.phone"), render: (r) => <span className="num">{r.phone}</span> },
        { key: "orders", title: t("customers.orders"), render: (r) => <span className="num">{r.ordersCount}</span> },
        { key: "spent", title: t("customers.totalSpent"), hideBelow: "md", render: (r) => <span className="num">{money(r.totalSpent)}</span> },
        { key: "last", title: t("customers.lastOrder"), hideBelow: "lg", render: (r) => <span className="num text-xs">{r.lastOrderAt ? date(r.lastOrderAt) : "—"}</span> },
        { key: "status", title: t("common.status"), render: (r) => <Badge tone={r.status === "ACTIVE" ? "good" : "bad"}>{t(`userStatus.${r.status}` as MessageKey)}</Badge> },
      ]} />
      <Pager meta={data?.meta} onPage={setPage} />
    </div>
  );
}

interface Detail { id: string; name: string; phone: string; email: string | null; status: string; createdAt: string; householdSize: number | null; addresses: { id: string; label: string; street: string; building: string; unit: string | null; area: { nameAr: string }; emirate: { nameAr: string } }[]; orders: OrderDTO[] }

interface BehaviorStats { totalOrders: number; deliveredOrders: number; cancelledOrders: number; failedDeliveries: number }

export function CustomerDetail({ id, canWrite }: { id: string; canWrite: boolean }) {
  const { t } = useI18n(); const { money, date, dateTime } = useFmt(); const toast = useToast(); const err = useErr();
  const { data: c, reload } = useApi<Detail>(`/api/admin/customers/${id}`);
  const { data: behavior } = useApi<BehaviorStats>(`/api/admin/customers/${id}/behavior`);
  if (!c) return <p className="text-muted">{t("common.loading")}</p>;
  const toggle = async () => { try { await api(`/api/admin/customers/${id}`, { method: "PATCH", json: { status: c.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" } }); toast.success(t("admin.saved")); reload(); } catch (e) { toast.error(err(e)); } };
  const cancelRate = behavior && behavior.totalOrders > 0 ? behavior.cancelledOrders / behavior.totalOrders : 0;
  return (
    <div>
      <PageHeader title={c.name}>
        <Badge tone={c.status === "ACTIVE" ? "good" : "bad"}>{t(`userStatus.${c.status}` as MessageKey)}</Badge>
        {canWrite && <Button size="sm" variant={c.status === "ACTIVE" ? "danger" : "secondary"} onClick={toggle}>{c.status === "ACTIVE" ? t("customers.suspend") : t("customers.activate")}</Button>}
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 text-sm shadow-card"><div className="num">{c.phone}</div>{c.email && <div className="num text-muted">{c.email}</div>}<div className="text-xs text-muted">{t("f.createdAt")}: {dateTime(c.createdAt)}</div>{c.householdSize && <div className="text-xs text-muted">{t("account.household")}: {c.householdSize}</div>}</div>
          {behavior && <div className="rounded-2xl bg-white p-4 text-sm shadow-card">
            <h2 className="font-extrabold">{t("customers.behavior" as MessageKey)}</h2>
            {cancelRate > 0.3 && <p className="mt-1 text-sm font-bold text-berry">{t("customers.warningFlag" as MessageKey)}</p>}
            <dl className="mt-2 grid grid-cols-2 gap-2">
              <div><dt className="text-xs text-muted">{t("customers.totalOrders" as MessageKey)}</dt><dd className="num font-bold">{behavior.totalOrders}</dd></div>
              <div><dt className="text-xs text-muted">{t("customers.deliveredOrders" as MessageKey)}</dt><dd className="num font-bold text-reef-700">{behavior.deliveredOrders}</dd></div>
              <div><dt className="text-xs text-muted">{t("customers.cancelledOrders" as MessageKey)}</dt><dd className="num font-bold text-berry">{behavior.cancelledOrders}</dd></div>
              <div><dt className="text-xs text-muted">{t("customers.failedDeliveries" as MessageKey)}</dt><dd className="num font-bold text-orange-600">{behavior.failedDeliveries}</dd></div>
            </dl>
          </div>}
          <div className="rounded-2xl bg-white p-4 text-sm shadow-card"><h2 className="font-extrabold">{t("customers.addresses")}</h2><ul className="mt-2 space-y-2">{c.addresses.map((a) => <li key={a.id}><b>{a.label}</b> — {a.emirate.nameAr} · {a.area.nameAr}<br /><span className="text-muted">{a.street}، {a.building}{a.unit ? `، ${a.unit}` : ""}</span></li>)}{!c.addresses.length && <li className="text-muted">{t("address.none")}</li>}</ul></div>
        </div>
        <Table<OrderDTO> rows={c.orders} columns={[
          { key: "number", title: t("orders.number"), render: (o) => <Link href={`/admin/orders/${o.id}`} className="num font-bold text-reef-700">{o.number}</Link> },
          { key: "date", title: t("common.date"), render: (o) => <span className="num text-xs">{date(o.createdAt)}</span> },
          { key: "status", title: t("common.status"), render: (o) => <StatusBadge status={o.status} /> },
          { key: "total", title: t("common.total"), render: (o) => <span className="num">{money(o.finalTotal ?? o.total)}</span> },
        ]} />
      </div>
    </div>
  );
}
