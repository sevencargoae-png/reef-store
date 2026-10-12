"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Barcode } from "./barcode";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import { useFmt } from "@/lib/use-format";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Badge, Modal, PageHeader, Pager, Table, useApi, useErr } from "./ui";
import { StatusBadge } from "@/components/store/account-views";
import type { OrderDTO } from "@/lib/services/orders";
import { TRANSITIONS } from "@/lib/order-status";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { MessageKey } from "@/lib/i18n/messages";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export function OrdersList() {
  const { t } = useI18n();
  const { money, date, dateTime } = useFmt();
  const sp = useSearchParams();
  const [q, setQ] = useState(""); const [status, setStatus] = useState(sp.get("status") ?? ""); const [day, setDay] = useState(""); const [page, setPage] = useState(1);
  const url = useMemo(() => `/api/admin/orders?page=${page}&q=${encodeURIComponent(q)}&status=${status}&date=${day}`, [page, q, status, day]);
  const { data, loading } = useApi<{ items: OrderDTO[]; meta: { page: number; pages: number; total: number } }>(url);
  return (
    <div>
      <PageHeader title={t("admin.orders")}>
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t("orders.search")} className="!h-10 !w-56" />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="!h-10 !w-44 !py-1"><option value="">{t("common.all")}</option>{STATUSES.map((s) => <option key={s} value={s}>{t(`orderStatus.${s}` as MessageKey)}</option>)}</Select>
        <Input type="date" value={day} onChange={(e) => { setDay(e.target.value); setPage(1); }} className="!h-10 !w-40" dir="ltr" />
      </PageHeader>
      <Table<OrderDTO> rows={data?.items ?? null} loading={loading} columns={[
        { key: "number", title: t("orders.number"), render: (o) => <Link href={`/admin/orders/${o.id}`} className="num font-bold text-reef-700">{o.number}</Link> },
        { key: "customer", title: t("orders.customer"), render: (o) => <div>{o.customer.name}<div className="num text-xs text-muted">{o.customer.phone}</div></div> },
        { key: "area", title: t("orders.area"), hideBelow: "md", render: (o) => <span>{o.address.emirateName} · {o.address.areaName}</span> },
        { key: "delivery", title: t("orders.deliveryOn"), hideBelow: "md", render: (o) => o.deliveryDate ? <span className="num text-xs">{date(o.deliveryDate + "T00:00:00Z")} {o.slotLabel}</span> : "—" },
        { key: "status", title: t("common.status"), render: (o) => <StatusBadge status={o.status} /> },
        { key: "pay", title: t("orders.payment"), hideBelow: "lg", render: (o) => <Badge tone={o.paymentStatus === "PAID" ? "good" : "warn"}>{t(`paymentStatus.${o.paymentStatus}` as MessageKey)}</Badge> },
        { key: "total", title: t("common.total"), render: (o) => <span className="num font-bold">{money(o.finalTotal ?? o.total)}</span> },
        { key: "createdAt", title: t("common.date"), hideBelow: "lg", render: (o) => <span className="num text-xs">{dateTime(o.createdAt)}</span> },
      ]} />
      <Pager meta={data?.meta} onPage={setPage} />
    </div>
  );
}

type Detail = OrderDTO & { cost: number; costByItem: Record<string, number> };

export function OrderDetail({ id, canWrite }: { id: string; canWrite: boolean }) {
  const { t } = useI18n();
  const L = useLocalized();
  const { money, date, dateTime, qty } = useFmt();
  const toast = useToast(); const err = useErr();
  const { data: o, setData, reload } = useApi<Detail>(`/api/admin/orders/${id}`);
  const [weights, setWeights] = useState<Record<string, string> | null>(null);
  const [statusModal, setStatusModal] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  if (!o) return <p className="text-muted">{t("common.loading")}</p>;
  const next = TRANSITIONS[o.status];
  const revenue = o.finalTotal ?? o.total;
  const post = async (path: string, json?: unknown) => { setPending(true); try { const r = await api<OrderDTO>(path, { method: "POST", json }); setData({ ...o, ...r }); await reload(); toast.success(t("admin.saved")); } catch (e) { toast.error(err(e)); } finally { setPending(false); } };
  return (
    <div className="print:text-black">
      <PageHeader title={`${t("orders.details")} ${o.number}`}>
        <StatusBadge status={o.status} />
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" />{t("orders.print")}</Button>
        {canWrite && next.map((s) => <Button key={s} size="sm" variant={s === "CANCELLED" ? "danger" : "primary"} onClick={() => setStatusModal(s)}>{t(`orderStatus.${s}` as MessageKey)}</Button>)}
        {canWrite && o.paymentStatus !== "PAID" && o.status === "DELIVERED" && <Button size="sm" variant="secondary" loading={pending} onClick={() => post(`/api/admin/orders/${id}/paid`)}>{t("orders.markPaid")}</Button>}
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between"><h2 className="font-extrabold">{t("cart.items", { count: o.items.length })}</h2>
              {canWrite && ["CONFIRMED", "PREPARING"].includes(o.status) && !weights && <Button size="sm" variant="outline" onClick={() => setWeights(Object.fromEntries(o.items.map((i) => [i.id, String(i.actualQty ?? i.qty)])))}>{t("orders.weights")}</Button>}
            </div>
            <table className="w-full text-sm"><thead><tr className="text-xs text-muted"><th className="py-1 text-start">{t("common.name")}</th><th className="text-start">{t("orders.ordered")}</th><th className="text-start">{t("orders.actual")}</th><th className="text-start">{t("f.price")}</th><th className="text-end">{t("common.total")}</th></tr></thead>
              <tbody>{o.items.map((i) => <tr key={i.id} className="border-t border-reef-50"><td className="py-2 font-semibold">{L(i, "name")}{i.soldByActualWeight && <Badge tone="info">⚖</Badge>}</td><td className="num">{qty(i.qty, i.unit)}</td><td className="num">{weights ? <Input type="number" step="any" min={0} dir="ltr" value={weights[i.id]} onChange={(e) => setWeights({ ...weights, [i.id]: e.target.value })} className="!w-24 !py-1" /> : i.actualQty != null ? qty(i.actualQty, i.unit) : "—"}</td><td className="num">{money(i.unitPrice)}</td><td className="num text-end">{money(i.lineTotal)}</td></tr>)}</tbody></table>
            {weights && <div className="mt-3 flex gap-2"><Button size="sm" loading={pending} onClick={async () => { await post(`/api/admin/orders/${id}/weights`, { items: Object.entries(weights).map(([itemId, v]) => ({ itemId, actualQty: Number(v) })) }); setWeights(null); }}>{t("orders.saveWeights")}</Button><Button size="sm" variant="ghost" onClick={() => setWeights(null)}>{t("common.cancel")}</Button></div>}
            <dl className="mt-3 grid gap-1 border-t border-reef-100 pt-3 text-sm md:grid-cols-2">
              <div className="flex justify-between"><dt>{t("cart.subtotal")}</dt><dd className="num">{money(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>{t("cart.discount")} {o.couponCode && `(${o.couponCode})`}</dt><dd className="num">-{money(o.discount)}</dd></div>
              <div className="flex justify-between"><dt>{t("cart.delivery")}</dt><dd className="num">{money(o.deliveryFee)}</dd></div>
              <div className="flex justify-between"><dt>{t("cart.vat", { rate: Math.round(o.vatRate * 100) })}</dt><dd className="num">{money(o.vatAmount)}</dd></div>
              <div className="flex justify-between font-extrabold"><dt>{t("orders.total")}</dt><dd className="num">{money(o.total)}</dd></div>
              {o.finalTotal != null && <div className="flex justify-between font-extrabold text-reef-800"><dt>{t("orders.finalTotal")}</dt><dd className="num">{money(o.finalTotal)}</dd></div>}
              <div className="flex justify-between text-muted"><dt>{t("orders.cost")}</dt><dd className="num">{money(o.cost)}</dd></div>
              <div className="flex justify-between text-muted"><dt>{t("orders.profit")}</dt><dd className="num">{money(revenue - o.deliveryFee - o.cost)}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-card print:hidden">
            <h2 className="font-extrabold">{t("orders.timeline")}</h2>
            <ol className="mt-2 space-y-2 text-sm">{o.events.map((e) => <li key={e.id} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-reef-500" /><div><b>{e.toStatus ? t(`orderStatus.${e.toStatus}` as MessageKey) : e.type}</b>{e.note && <span className="text-muted"> — {e.note}</span>}<div className="num text-xs text-muted">{dateTime(e.createdAt)}{e.by && ` · ${e.by}`}</div></div></li>)}</ol>
            {canWrite && <form className="mt-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; await post(`/api/admin/orders/${id}/note`, { note }); setNote(""); }}><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("orders.addNote")} /><Button type="submit" size="sm" variant="secondary">{t("common.add")}</Button></form>}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 text-center shadow-card">
            <Barcode value={o.number} />
          </div>
          <div className="rounded-2xl bg-white p-4 text-sm shadow-card">
            <h2 className="font-extrabold">{t("orders.customer")}</h2>
            <p className="mt-1"><Link href={`/admin/customers/${o.customer.id}`} className="font-semibold text-reef-700">{o.customer.name}</Link><br /><a href={`tel:${o.customer.phone}`} className="num text-muted">{o.customer.phone}</a></p>
            <h2 className="mt-3 font-extrabold">{t("checkout.address")}</h2>
            <p className="mt-1 text-muted">{o.address.emirateName} · {o.address.areaName}<br />{o.address.street}، {o.address.building}{o.address.unit ? `، ${o.address.unit}` : ""}{o.address.notes && <><br />{o.address.notes}</>}</p>
            {o.deliveryDate && <p className="mt-2 font-semibold">{t("orders.deliveryOn")}: {date(o.deliveryDate + "T00:00:00Z")} <span className="num" dir="ltr">{o.slotLabel}</span></p>}
            <p className="mt-2">{t("orders.payment")}: {t("checkout.cod")} · <Badge tone={o.paymentStatus === "PAID" ? "good" : "warn"}>{t(`paymentStatus.${o.paymentStatus}` as MessageKey)}</Badge></p>
            {o.notes && <p className="mt-2 rounded-xl bg-sun/15 px-3 py-2">{o.notes}</p>}
          </div>
        </div>
      </div>
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title={t("orders.changeStatus")}>
        {statusModal && <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await post(`/api/admin/orders/${id}/status`, { status: statusModal, note: fd.get("note") || null }); setStatusModal(null); }}>
          <p className="text-sm">{t(`orderStatus.${o.status}` as MessageKey)} → <b>{t(`orderStatus.${statusModal}` as MessageKey)}</b></p>
          <Textarea name="note" placeholder={t("orders.note")} className="min-h-20" />
          <Button type="submit" loading={pending} variant={statusModal === "CANCELLED" ? "danger" : "primary"}>{t("common.confirm")}</Button>
        </form>}
      </Modal>
    </div>
  );
}
