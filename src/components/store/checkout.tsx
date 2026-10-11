"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Banknote, MapPin, Clock, Ticket } from "lucide-react";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import { useFmt } from "@/lib/use-format";
import { api, ApiError } from "@/lib/client-api";
import { useCart } from "./cart-provider";
import { AddressForm, type AddressRow, type Geo } from "./address-form";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";
import { cx } from "@/components/ui/cx";
import type { SlotOption } from "@/lib/services/delivery";
import type { quoteCart } from "@/lib/services/orders";
import type { MessageKey } from "@/lib/i18n/messages";

type Quote = Awaited<ReturnType<typeof quoteCart>>;

export function Checkout({ geo, addresses: initialAddresses, slots }: { geo: Geo; addresses: AddressRow[]; slots: SlotOption[] }) {
  const { t, locale } = useI18n();
  const L = useLocalized();
  const { money, date } = useFmt();
  const router = useRouter();
  const { cart, reload } = useCart();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState(initialAddresses.find((a) => a.isDefault)?.id ?? initialAddresses[0]?.id ?? "");
  const [adding, setAdding] = useState(initialAddresses.length === 0);
  const [slot, setSlot] = useState<SlotOption | null>(null);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [q, setQ] = useState<Quote | null>(null);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api<Quote>("/api/checkout/quote", { method: "POST", json: { addressId: addressId || null, couponCode: applied } }).then(setQ).catch(() => {}); }, [addressId, applied, cart]);

  const dates = useMemo(() => Array.from(new Set(slots.map((s) => s.date))), [slots]);
  const [day, setDay] = useState(dates[0] ?? "");
  const daySlots = slots.filter((s) => s.date === day);
  const address = addresses.find((a) => a.id === addressId);
  const T = (k: string) => t(k as MessageKey);

  async function place() {
    if (!addressId || !slot) return;
    setPending(true); setErr(null);
    try {
      const o = await api<{ id: string; number: string }>("/api/orders", { method: "POST", json: { addressId, slotId: slot.slotId, deliveryDate: slot.date, couponCode: applied, notes } });
      await reload();
      router.push(`/checkout/success?n=${encodeURIComponent(o.number)}&id=${o.id}`);
    } catch (e) { setErr(e instanceof ApiError ? T(`error.${e.code}`) : t("common.error")); setPending(false); }
  }

  if (!cart.items.length) return <p className="py-20 text-center text-muted">{t("cart.empty")}</p>;
  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-extrabold"><MapPin className="h-5 w-5 text-reef-600" />{t("checkout.address")}</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {addresses.map((a) => (
              <button type="button" key={a.id} onClick={() => { setAddressId(a.id); setAdding(false); }} className={cx("rounded-xl border p-3 text-start text-sm transition", addressId === a.id && !adding ? "border-reef-600 bg-mint-50 ring-2 ring-reef-100" : "border-reef-100 hover:bg-mint-50/50")}>
                <div className="font-bold">{a.label}</div>
                <div className="text-muted">{a.emirate && (locale === "ar" ? a.emirate.nameAr : a.emirate.nameEn)} · {a.area && (locale === "ar" ? a.area.nameAr : a.area.nameEn)}</div>
                <div className="text-muted">{a.street}، {a.building}{a.unit ? `، ${a.unit}` : ""}</div>
              </button>
            ))}
          </div>
          {adding ? (
            <div className="mt-4 border-t border-reef-100 pt-4"><AddressForm geo={geo} onSaved={(a) => { setAddresses((s) => [...s, a]); setAddressId(a.id); setAdding(false); }} onCancel={addresses.length ? () => setAdding(false) : undefined} /></div>
          ) : (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setAdding(true)}>{t("checkout.newAddress")}</Button>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-extrabold"><Clock className="h-5 w-5 text-reef-600" />{t("checkout.slot")}</h2>
          {!slots.length ? <p className="mt-2 text-sm text-muted">{t("checkout.noSlots")}</p> : (
            <>
              <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {dates.map((d) => <button type="button" key={d} onClick={() => { setDay(d); setSlot(null); }} className={cx("shrink-0 rounded-xl border px-3 py-2 text-sm", day === d ? "border-reef-600 bg-reef-600 text-white" : "border-reef-200")}><div className="font-bold">{T(`weekday.${new Date(d + "T00:00:00Z").getUTCDay()}`)}</div><div className="num text-xs opacity-80">{date(d + "T00:00:00Z")}</div></button>)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {daySlots.map((s) => <button type="button" key={s.slotId + s.date} onClick={() => setSlot(s)} className={cx("num rounded-full border px-4 py-2 text-sm font-semibold", slot?.slotId === s.slotId && slot?.date === s.date ? "border-reef-600 bg-mint-100 text-reef-800" : "border-reef-200")} dir="ltr">{s.label}</button>)}
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-extrabold"><Banknote className="h-5 w-5 text-reef-600" />{t("checkout.payment")}</h2>
          <label className="mt-3 flex items-center gap-3 rounded-xl border border-reef-600 bg-mint-50 p-3 text-sm"><input type="radio" checked readOnly className="accent-reef-600" /><div><div className="font-bold">{t("checkout.cod")}</div><div className="text-muted">{t("checkout.cod.sub")}</div></div></label>
          <Textarea className="mt-4" placeholder={t("checkout.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </section>
      </div>

      <aside className="h-fit rounded-2xl bg-white p-5 shadow-card lg:sticky lg:top-20">
        <h2 className="font-extrabold">{t("checkout.summary")}</h2>
        <ul className="mt-3 max-h-60 space-y-1 overflow-auto text-sm">{cart.items.map((l) => <li key={l.product.id} className="flex justify-between gap-2"><span className="line-clamp-1">{L(l.product, "name")} <span className="num text-muted">× {l.qty}</span></span><span className="num">{money(l.lineTotal)}</span></li>)}</ul>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setApplied(coupon.trim() || null); }}>
          <div className="relative flex-1"><Ticket className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder={t("checkout.coupon")} className="!ps-9 uppercase" dir="ltr" /></div>
          <Button type="submit" variant="secondary">{t("checkout.applyCoupon")}</Button>
        </form>
        {q?.couponError && <p className="mt-1 text-xs text-berry">{T(`error.${q.couponError}`)}</p>}
        {q && (
          <dl className="mt-4 space-y-2 border-t border-reef-100 pt-3 text-sm">
            <div className="flex justify-between"><dt>{t("cart.subtotal")}</dt><dd className="num">{money(q.quote.subtotal)}</dd></div>
            {q.quote.discount > 0 && <div className="flex justify-between text-reef-700"><dt>{t("cart.discount")} ({q.coupon?.code})</dt><dd className="num">-{money(q.quote.discount)}</dd></div>}
            <div className="flex justify-between"><dt>{t("cart.delivery")}</dt><dd className="num">{address ? (q.quote.deliveryFee === 0 ? t("common.free") : money(q.quote.deliveryFee)) : t("cart.deliveryTbd")}</dd></div>
            {q.settings.vatEnabled && <div className="flex justify-between text-muted"><dt>{t("cart.vat", { rate: Math.round(q.settings.vatRate * 100) })}{q.settings.pricesIncludeVat ? ` — ${t("cart.vatIncluded")}` : ""}</dt><dd className="num">{money(q.quote.vatAmount)}</dd></div>}
            <div className="flex justify-between text-base font-extrabold text-reef-800"><dt>{t("cart.total")}</dt><dd className="num">{money(q.quote.total)}</dd></div>
            {!q.minOrderMet && <p className="text-xs text-berry">{t("cart.minOrder", { amount: money(q.minOrder) })}</p>}
          </dl>
        )}
        {cart.items.some((l) => l.product.soldByActualWeight) && <p className="mt-3 text-xs leading-5 text-muted">{t("cart.weightNotice")}</p>}
        {err && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-berry">{err}</p>}
        <Button size="lg" className="mt-4 w-full" loading={pending} disabled={!addressId || adding || !slot || !q?.minOrderMet || !q?.settings.codEnabled} onClick={place}>{t("checkout.place")}</Button>
      </aside>
    </div>
  );
}
