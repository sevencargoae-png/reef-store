"use client";
import Link from "next/link";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import { useFmt } from "@/lib/use-format";
import { Stat, Table, useApi, PageHeader, Badge } from "./ui";
import { StatusBadge } from "@/components/store/account-views";
import type { OrderDTO } from "@/lib/services/orders";

interface D { ordersToday: number; pending: number; revenueWeek: number; lowStock: { id: string; nameAr: string; nameEn: string; stockQty: number; unit: string }[]; tomorrow: number; customers: number; recent: OrderDTO[] }

export function Dashboard() {
  const { t } = useI18n();
  const L = useLocalized();
  const { money, dateTime, qty } = useFmt();
  const { data } = useApi<D>("/api/admin/dashboard");
  return (
    <div>
      <PageHeader title={t("admin.dashboard")} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label={t("kpi.ordersToday")} value={data?.ordersToday ?? "—"} />
        <Stat label={t("kpi.pending")} value={data?.pending ?? "—"} />
        <Stat label={t("kpi.revenueWeek")} value={data ? money(data.revenueWeek) : "—"} />
        <Stat label={t("kpi.tomorrowDeliveries")} value={data?.tomorrow ?? "—"} />
        <Stat label={t("kpi.lowStock")} value={data?.lowStock.length ?? "—"} />
        <Stat label={t("kpi.customers")} value={data?.customers ?? "—"} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="mb-2 font-extrabold">{t("kpi.recentOrders")}</h2>
          <Table<OrderDTO> rows={data?.recent ?? null} loading={!data} columns={[
            { key: "number", title: t("orders.number"), render: (o) => <Link href={`/admin/orders/${o.id}`} className="num font-bold text-reef-700">{o.number}</Link> },
            { key: "customer", title: t("orders.customer"), render: (o) => <span>{o.customer.name}<br /><span className="num text-xs text-muted">{o.customer.phone}</span></span> },
            { key: "status", title: t("common.status"), render: (o) => <StatusBadge status={o.status} /> },
            { key: "total", title: t("common.total"), render: (o) => <span className="num">{money(o.finalTotal ?? o.total)}</span> },
            { key: "createdAt", title: t("common.date"), hideBelow: "md", render: (o) => <span className="num text-xs">{dateTime(o.createdAt)}</span> },
          ]} />
        </section>
        <section>
          <h2 className="mb-2 font-extrabold">{t("kpi.lowStockList")}</h2>
          <ul className="divide-y divide-reef-50 rounded-2xl bg-white shadow-card">
            {data?.lowStock.map((p) => <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm"><Link href={`/admin/products?q=${encodeURIComponent(p.nameAr)}`} className="font-semibold">{L(p, "name")}</Link><Badge tone={p.stockQty <= 0 ? "bad" : "warn"}>{qty(p.stockQty, p.unit)}</Badge></li>)}
            {data && !data.lowStock.length && <li className="px-3 py-6 text-center text-sm text-muted">{t("common.noData")}</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
