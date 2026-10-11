"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import { useFmt } from "@/lib/use-format";
import { api, ApiError } from "@/lib/client-api";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { useCart } from "./cart-provider";
import { AddressForm, type AddressRow, type Geo } from "./address-form";
import { ProductCard } from "./product-card";
import type { OrderDTO } from "@/lib/services/orders";
import type { ListDTO } from "@/lib/services/lists";
import type { SubscriptionDTO } from "@/lib/services/subscriptions";
import type { ProductDTO } from "@/lib/services/catalog";
import type { MessageKey } from "@/lib/i18n/messages";
import { cx } from "@/components/ui/cx";

const STATUS_COLOR: Record<string, string> = { PENDING: "bg-sun/20 text-amber-800", CONFIRMED: "bg-mint-100 text-reef-800", PREPARING: "bg-blue-50 text-blue-800", OUT_FOR_DELIVERY: "bg-indigo-50 text-indigo-800", DELIVERED: "bg-reef-600 text-white", CANCELLED: "bg-gray-100 text-gray-600" };
export function StatusBadge({ status }: { status: string }) { const { t } = useI18n(); return <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_COLOR[status])}>{t(`orderStatus.${status}` as MessageKey)}</span>; }

export function ProfileView({ user }: { user: { name: string; phone: string; email: string | null; householdSize: number | null; role: string } }) {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [p1, setP1] = useState(false); const [p2, setP2] = useState(false);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form className="space-y-4 rounded-2xl bg-white p-5 shadow-card" onSubmit={async (e) => { e.preventDefault(); setP1(true); const fd = new FormData(e.currentTarget); try { await api("/api/account/profile", { method: "PATCH", json: { name: fd.get("name"), email: fd.get("email") || "", householdSize: fd.get("householdSize") ? Number(fd.get("householdSize")) : null } }); toast.success(t("account.saved")); router.refresh(); } catch { toast.error(t("common.error")); } finally { setP1(false); } }}>
        <h2 className="font-extrabold">{t("account.profile")}</h2>
        <Field label={t("auth.name")}>{(p) => <Input {...p} name="name" defaultValue={user.name} required minLength={2} />}</Field>
        <Field label={t("auth.phone")}>{(p) => <Input {...p} value={user.phone} readOnly dir="ltr" className="bg-mint-50" />}</Field>
        <Field label={t("auth.email")}>{(p) => <Input {...p} name="email" type="email" dir="ltr" defaultValue={user.email ?? ""} />}</Field>
        <Field label={t("account.household")}>{(p) => <Input {...p} name="householdSize" type="number" min={1} max={30} defaultValue={user.householdSize ?? ""} />}</Field>
        <Button type="submit" loading={p1}>{t("account.save")}</Button>
      </form>
      {user.role !== "CUSTOMER" && <form className="space-y-4 rounded-2xl bg-white p-5 shadow-card" onSubmit={async (e) => { e.preventDefault(); setP2(true); const f = e.currentTarget; const fd = new FormData(f); try { await api("/api/auth/password", { method: "POST", json: { current: fd.get("current"), next: fd.get("next") } }); toast.success(t("account.saved")); f.reset(); } catch (ex) { toast.error(ex instanceof ApiError ? t(`error.${ex.code}` as MessageKey) : t("common.error")); } finally { setP2(false); } }}>
        <h2 className="font-extrabold">{t("account.changePassword")}</h2>
        <Field label={t("account.currentPassword")}>{(p) => <Input {...p} name="current" type="password" autoComplete="current-password" required />}</Field>
        <Field label={t("account.newPassword")} hint={t("auth.passwordMin")}>{(p) => <Input {...p} name="next" type="password" autoComplete="new-password" required minLength={8} />}</Field>
        <Button type="submit" variant="outline" loading={p2}>{t("account.save")}</Button>
      </form>}
    </div>
  );
}

export function OrdersView({ orders }: { orders: OrderDTO[] }) {
  const { t } = useI18n();
  const { money, date } = useFmt();
  const { addMany } = useCart();
  const toast = useToast();
  const router = useRouter();
  if (!orders.length) return <div className="rounded-2xl bg-white p-10 text-center shadow-card"><p className="text-muted">{t("orders.empty")}</p><LinkButton href="/products" className="mt-4">{t("cart.emptyCta")}</LinkButton></div>;
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
          <div className="min-w-0 flex-1">
            <Link href={`/account/orders/${o.id}`} className="num font-extrabold text-reef-800 hover:underline">{o.number}</Link>
            <div className="text-xs text-muted">{date(o.createdAt)} · {o.items.length} {t("unit.PIECE")}{o.deliveryDate ? ` · ${t("orders.deliveryOn")} ${date(o.deliveryDate + "T00:00:00Z")} ${o.slotLabel ?? ""}` : ""}</div>
          </div>
          <StatusBadge status={o.status} />
          <span className="num font-extrabold">{money(o.finalTotal ?? o.total)}</span>
          <Button size="sm" variant="secondary" onClick={async () => { const r = await addMany(o.items.filter((i) => i.productId).map((i) => ({ productId: i.productId!, qty: i.qty }))); toast.success(t("orders.reordered")); if (r.skipped.length) toast.info(t("cart.adjusted")); router.push("/cart"); }}>{t("orders.reorder")}</Button>
        </li>
      ))}
    </ul>
  );
}

export function OrderDetailView({ order: initial }: { order: OrderDTO }) {
  const { t } = useI18n();
  const L = useLocalized();
  const { money, date, dateTime, qty } = useFmt();
  const [order, setOrder] = useState(initial);
  const toast = useToast();
  const canCancel = ["PENDING", "CONFIRMED"].includes(order.status);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><h1 className="num text-2xl font-extrabold text-reef-800">{order.number}</h1><StatusBadge status={order.status} /><span className="text-sm text-muted">{dateTime(order.createdAt)}</span>
        {canCancel && <Button size="sm" variant="danger" className="ms-auto" onClick={async () => { if (!confirm(t("orders.cancelConfirm"))) return; try { setOrder(await api<OrderDTO>(`/api/orders/${order.id}/cancel`, { method: "POST" })); } catch { toast.error(t("common.error")); } }}>{t("orders.cancel")}</Button>}
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <table className="w-full text-sm"><thead><tr className="text-start text-xs text-muted"><th className="py-1 text-start">{t("common.name")}</th><th className="text-start">{t("product.qty")}</th>{order.items.some((i) => i.actualQty != null) && <th className="text-start">{t("orders.actualQty")}</th>}<th className="text-end">{t("common.total")}</th></tr></thead>
            <tbody>{order.items.map((i) => <tr key={i.id} className="border-t border-reef-50"><td className="py-2 font-semibold">{L(i, "name")}</td><td className="num">{qty(i.qty, i.unit)}</td>{order.items.some((x) => x.actualQty != null) && <td className="num">{i.actualQty != null ? qty(i.actualQty, i.unit) : "—"}</td>}<td className="num text-end">{money(i.lineTotal)}</td></tr>)}</tbody></table>
          <dl className="mt-3 space-y-1 border-t border-reef-100 pt-3 text-sm">
            <div className="flex justify-between"><dt>{t("cart.subtotal")}</dt><dd className="num">{money(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-reef-700"><dt>{t("cart.discount")} {order.couponCode && `(${order.couponCode})`}</dt><dd className="num">-{money(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt>{t("cart.delivery")}</dt><dd className="num">{order.deliveryFee ? money(order.deliveryFee) : t("common.free")}</dd></div>
            {order.vatAmount > 0 && <div className="flex justify-between text-muted"><dt>{t("cart.vat", { rate: Math.round(order.vatRate * 100) })}</dt><dd className="num">{money(order.vatAmount)}</dd></div>}
            <div className="flex justify-between text-base font-extrabold"><dt>{t("orders.total")}</dt><dd className="num">{money(order.total)}</dd></div>
            {order.finalTotal != null && order.finalTotal !== order.total && <div className="flex justify-between text-base font-extrabold text-reef-800"><dt>{t("orders.finalTotal")}</dt><dd className="num">{money(order.finalTotal)}</dd></div>}
          </dl>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 text-sm shadow-card"><h2 className="font-extrabold">{t("checkout.address")}</h2><p className="mt-1 text-muted">{order.address.emirateName} · {order.address.areaName}<br />{order.address.street}، {order.address.building}{order.address.unit ? `، ${order.address.unit}` : ""}</p>{order.deliveryDate && <p className="mt-2 font-semibold">{t("orders.deliveryOn")}: {date(order.deliveryDate + "T00:00:00Z")} <span className="num" dir="ltr">{order.slotLabel}</span></p>}<p className="mt-2">{t("checkout.payment")}: {t("checkout.cod")} · {t(`paymentStatus.${order.paymentStatus}` as MessageKey)}</p></div>
          <div className="rounded-2xl bg-white p-4 text-sm shadow-card"><h2 className="font-extrabold">{t("orders.timeline")}</h2><ol className="mt-2 space-y-2">{order.events.map((e) => <li key={e.id} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-reef-500" /><div><div className="font-semibold">{e.toStatus ? t(`orderStatus.${e.toStatus}` as MessageKey) : e.type}</div><div className="text-xs text-muted">{dateTime(e.createdAt)}</div></div></li>)}</ol></div>
        </div>
      </div>
    </div>
  );
}

export function AddressesView({ geo, addresses: initial }: { geo: Geo; addresses: AddressRow[] }) {
  const { t, locale } = useI18n();
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<AddressRow | null | "new">(null);
  const toast = useToast();
  const reload = async () => setAddresses(await api<AddressRow[]>("/api/account/addresses"));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-extrabold text-reef-800">{t("address.title")}</h1><Button size="sm" onClick={() => setEditing("new")}>{t("checkout.newAddress")}</Button></div>
      {editing && <div className="rounded-2xl bg-white p-5 shadow-card"><AddressForm geo={geo} initial={editing === "new" ? null : editing} onSaved={async () => { setEditing(null); await reload(); toast.success(t("account.saved")); }} onCancel={() => setEditing(null)} /></div>}
      {!addresses.length && !editing && <p className="rounded-2xl bg-white p-8 text-center text-muted shadow-card">{t("address.none")}</p>}
      <ul className="grid gap-3 md:grid-cols-2">{addresses.map((a) => (
        <li key={a.id} className="rounded-2xl bg-white p-4 text-sm shadow-card">
          <div className="flex items-center gap-2"><span className="font-extrabold">{a.label}</span>{a.isDefault && <span className="rounded-full bg-mint-100 px-2 text-xs font-bold text-reef-800">{t("address.default")}</span>}</div>
          <p className="mt-1 text-muted">{a.emirate && (locale === "ar" ? a.emirate.nameAr : a.emirate.nameEn)} · {a.area && (locale === "ar" ? a.area.nameAr : a.area.nameEn)}<br />{a.street}، {a.building}{a.unit ? `، ${a.unit}` : ""}{a.notes ? ` — ${a.notes}` : ""}</p>
          <div className="mt-2 flex gap-2"><Button size="sm" variant="ghost" onClick={() => setEditing(a)}>{t("common.edit")}</Button><Button size="sm" variant="ghost" className="text-berry" onClick={async () => { try { await api(`/api/account/addresses/${a.id}`, { method: "DELETE" }); await reload(); } catch { toast.error(t("common.error")); } }}>{t("address.delete")}</Button></div>
        </li>))}</ul>
    </div>
  );
}

export function ListsView({ lists: initial }: { lists: ListDTO[] }) {
  const { t } = useI18n();
  const L = useLocalized();
  const { qty } = useFmt();
  const { addMany } = useCart();
  const toast = useToast();
  const router = useRouter();
  const [lists, setLists] = useState(initial);
  const [name, setName] = useState("");
  const reload = async () => setLists(await api<ListDTO[]>("/api/account/lists"));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-2xl font-extrabold text-reef-800">{t("lists.title")}</h1>
        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; await api("/api/account/lists", { method: "POST", json: { name: name.trim(), items: [] } }); setName(""); await reload(); }}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("lists.name")} className="!h-10 !w-44" /><Button type="submit" size="sm">{t("lists.new")}</Button></form></div>
      {!lists.length && <p className="rounded-2xl bg-white p-8 text-center text-muted shadow-card">{t("lists.empty")}</p>}
      {lists.map((l) => (
        <section key={l.id} className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-extrabold">{l.name}</h2>{l.isWeekly && <span className="rounded-full bg-reef-600 px-2 text-xs font-bold text-white">{t("lists.weekly")}</span>}<span className="num text-xs text-muted">{t("lists.items", { count: l.items.length })}</span>
            <div className="ms-auto flex gap-1">
              {!l.isWeekly && <Button size="sm" variant="ghost" onClick={async () => { await api(`/api/account/lists/${l.id}`, { method: "PATCH", json: { isWeekly: true } }); await reload(); }}>{t("lists.markWeekly")}</Button>}
              <Button size="sm" variant="secondary" disabled={!l.items.length} onClick={async () => { const r = await addMany(l.items.map((i) => ({ productId: i.product.id, qty: i.qty }))); toast.success(t("orders.reordered")); if (r.skipped.length) toast.info(t("cart.adjusted")); router.push("/cart"); }}>{t("lists.addAll")}</Button>
              <Button size="sm" variant="ghost" className="text-berry" onClick={async () => { await api(`/api/account/lists/${l.id}`, { method: "DELETE" }); await reload(); }}>{t("lists.delete")}</Button>
            </div>
          </div>
          <ul className="mt-2 divide-y divide-reef-50 text-sm">{l.items.map((i) => (
            <li key={i.product.id} className="flex items-center gap-2 py-1.5"><span className="flex-1">{L(i.product, "name")}</span>
              <input type="number" step={i.product.step} min={0} defaultValue={i.qty} className="num w-20 rounded-lg border border-reef-200 px-2 py-1 text-sm" onBlur={async (e) => { const v = Number(e.target.value); if (v !== i.qty) { await api(`/api/account/lists/${l.id}/items`, { method: "PUT", json: { productId: i.product.id, qty: v } }); await reload(); } }} />
              <span className="w-12 text-xs text-muted">{qty(i.product.step, i.product.unit).split(" ")[1]}</span>
            </li>))}</ul>
        </section>
      ))}
    </div>
  );
}

export function SubscriptionsView({ subs: initial, addresses, slots }: { subs: SubscriptionDTO[]; addresses: AddressRow[]; slots: { id: string; weekday: number; label: string }[] }) {
  const { t, locale } = useI18n();
  const L = useLocalized();
  const { qty, date } = useFmt();
  const { cart } = useCart();
  const toast = useToast();
  const [subs, setSubs] = useState(initial);
  const [open, setOpen] = useState(false);
  const [weekday, setWeekday] = useState(0);
  const [pending, setPending] = useState(false);
  const reload = async () => setSubs(await api<SubscriptionDTO[]>("/api/account/subscriptions"));
  const T = (k: string) => t(k as MessageKey);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h1 className="text-2xl font-extrabold text-reef-800">{t("subs.title")}</h1><p className="text-sm text-muted">{t("subs.sub")}</p></div><Button size="sm" onClick={() => setOpen((o) => !o)} disabled={!cart.items.length || !addresses.length}>{t("subs.fromCart")}</Button></div>
      {open && (
        <form className="grid gap-3 rounded-2xl bg-white p-5 shadow-card md:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); setPending(true); const fd = new FormData(e.currentTarget); try { await api("/api/account/subscriptions", { method: "POST", json: { name: fd.get("name"), frequency: fd.get("frequency"), weekday, slotId: fd.get("slotId") || null, addressId: fd.get("addressId"), items: cart.items.map((l) => ({ productId: l.product.id, qty: l.qty })) } }); setOpen(false); await reload(); toast.success(t("account.saved")); } catch (ex) { toast.error(ex instanceof ApiError ? T(`error.${ex.code}`) : t("common.error")); } finally { setPending(false); } }}>
          <Field label={t("lists.name")} required>{(p) => <Input {...p} name="name" defaultValue={t("lists.weekly")} required />}</Field>
          <Field label={t("subs.frequency")}>{(p) => <Select {...p} name="frequency"><option value="WEEKLY">{t("subs.WEEKLY")}</option><option value="BIWEEKLY">{t("subs.BIWEEKLY")}</option></Select>}</Field>
          <Field label={t("subs.weekday")}>{(p) => <Select {...p} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>{[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{T(`weekday.${d}`)}</option>)}</Select>}</Field>
          <Field label={t("checkout.slot")}>{(p) => <Select {...p} name="slotId"><option value="">{t("common.none")}</option>{slots.filter((s) => s.weekday === weekday).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select>}</Field>
          <Field label={t("checkout.address")}>{(p) => <Select {...p} name="addressId">{addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.area && (locale === "ar" ? a.area.nameAr : a.area.nameEn)}</option>)}</Select>}</Field>
          <div className="flex items-end gap-2"><Button type="submit" loading={pending}>{t("common.save")}</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Button></div>
        </form>
      )}
      {!subs.length && <p className="rounded-2xl bg-white p-8 text-center text-muted shadow-card">{t("subs.empty")}</p>}
      {subs.map((s) => (
        <section key={s.id} className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-extrabold">{s.name}</h2><span className={cx("rounded-full px-2 text-xs font-bold", s.status === "ACTIVE" ? "bg-mint-100 text-reef-800" : "bg-gray-100 text-gray-600")}>{T(`subs.status.${s.status}`)}</span>
            <span className="text-xs text-muted">{T(`subs.${s.frequency}`)} · {T(`weekday.${s.weekday}`)}{s.slot ? ` · ${s.slot.label}` : ""} · {locale === "ar" ? s.address.areaNameAr : s.address.areaNameEn}</span>
            {s.status !== "CANCELLED" && <span className="text-xs">{t("subs.next")}: <b>{date(s.nextRunAt + "T00:00:00Z")}</b></span>}
            <div className="ms-auto flex gap-1">
              {s.status === "ACTIVE" && <Button size="sm" variant="ghost" onClick={async () => { await api(`/api/account/subscriptions/${s.id}`, { method: "PATCH", json: { status: "PAUSED" } }); await reload(); }}>{t("subs.pause")}</Button>}
              {s.status === "PAUSED" && <Button size="sm" variant="secondary" onClick={async () => { await api(`/api/account/subscriptions/${s.id}`, { method: "PATCH", json: { status: "ACTIVE" } }); await reload(); }}>{t("subs.resume")}</Button>}
              {s.status !== "CANCELLED" && <Button size="sm" variant="ghost" className="text-berry" onClick={async () => { await api(`/api/account/subscriptions/${s.id}`, { method: "PATCH", json: { status: "CANCELLED" } }); await reload(); }}>{t("subs.cancel")}</Button>}
            </div>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">{s.items.map((i) => <li key={i.product.id}>{L(i.product, "name")} <span className="num">{qty(i.qty, i.product.unit)}</span></li>)}</ul>
        </section>
      ))}
    </div>
  );
}

export function WishlistView({ products }: { products: ProductDTO[] }) {
  const { t } = useI18n();
  if (!products.length) return <p className="rounded-2xl bg-white p-8 text-center text-muted shadow-card">{t("account.wishlistEmpty")}</p>;
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>;
}
