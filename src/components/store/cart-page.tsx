"use client";
import { ProduceImage } from "./plant";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import { useFmt } from "@/lib/use-format";
import { useCart } from "./cart-provider";
import { QtyStepper } from "./product-card";
import { LinkButton, Button } from "@/components/ui/button";
import { SaveListButton } from "./save-list-button";

export function CartPage({ loggedIn }: { loggedIn: boolean }) {
  const { t } = useI18n();
  const L = useLocalized();
  const { money } = useFmt();
  const { cart, setQty, clear, loading } = useCart();
  if (loading) return <p className="py-20 text-center text-muted">{t("common.loading")}</p>;
  if (!cart.items.length) return (
    <div className="py-20 text-center"><h1 className="text-2xl font-extrabold text-reef-800">{t("cart.empty")}</h1><LinkButton href="/products" className="mt-6">{t("cart.emptyCta")}</LinkButton></div>
  );
  const hasWeighed = cart.items.some((l) => l.product.soldByActualWeight);
  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-3 flex items-center justify-between"><h1 className="text-2xl font-extrabold text-reef-800">{t("cart.title")}</h1><span className="num text-sm text-muted">{t("cart.items", { count: cart.items.length })}</span></div>
        {cart.adjusted && <p className="mb-3 rounded-xl bg-sun/15 px-3 py-2 text-sm text-ink">{t("cart.adjusted")}</p>}
        <ul className="divide-y divide-reef-100 overflow-hidden rounded-2xl bg-white shadow-card">
          {cart.items.map((l) => (
            <li key={l.product.id} className="flex items-center gap-3 p-3">
              <Link href={`/products/${l.product.slug}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mint-50 p-1"><ProduceImage url={l.product.images[0]?.url} alt="" variant="thumb" /></Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${l.product.slug}`} className="line-clamp-1 font-bold">{L(l.product, "name")}</Link>
                <div className="num text-xs text-muted">{money(l.product.price)} / {t(`unit.${l.product.unit}`)}</div>
                {l.product.soldByActualWeight && <div className="text-[11px] text-reef-700">{t("product.weightNote")}</div>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="num font-extrabold text-reef-800">{money(l.lineTotal)}</span>
                <QtyStepper product={l.product} size="sm" />
              </div>
              <button type="button" onClick={() => setQty(l.product.id, 0)} className="rounded-full p-2 text-muted hover:bg-red-50 hover:text-berry" aria-label={t("cart.remove")}><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => clear()}>{t("cart.clear")}</Button>
          {loggedIn && <SaveListButton />}
          <Link href="/products" className="ms-auto self-center text-sm font-semibold text-reef-700 underline">{t("cart.continue")}</Link>
        </div>
      </section>
      <aside className="h-fit rounded-2xl bg-white p-5 shadow-card lg:sticky lg:top-20">
        <h2 className="font-extrabold">{t("checkout.summary")}</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt>{t("cart.subtotal")}</dt><dd className="num font-semibold">{money(cart.subtotal)}</dd></div>
          <div className="flex justify-between text-muted"><dt>{t("cart.delivery")}</dt><dd>{t("cart.deliveryTbd")}</dd></div>
        </dl>
        {hasWeighed && <p className="mt-3 rounded-xl bg-mint-50 px-3 py-2 text-xs leading-5 text-reef-800">{t("cart.weightNotice")}</p>}
        <LinkButton href={loggedIn ? "/checkout" : "/login?next=/checkout"} size="lg" className="mt-4 w-full">{t("cart.checkout")}</LinkButton>
      </aside>
    </div>
  );
}
