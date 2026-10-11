"use client";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import { useFmt } from "@/lib/use-format";
import { useCart } from "./cart-provider";
import type { ProductDTO } from "@/lib/services/catalog";
import { cx } from "@/components/ui/cx";
import type { MessageKey } from "@/lib/i18n/messages";
import { WishButton } from "./wish-button";

export function QtyStepper({ product, size = "md" }: { product: ProductDTO; size?: "sm" | "md" | "lg" }) {
  const { t } = useI18n();
  const { qtyOf, setQty, busy } = useCart();
  const fmt = useFmt();
  const qty = qtyOf(product.id);
  const pending = busy === product.id;
  const h = size === "lg" ? "h-12" : size === "sm" ? "h-9" : "h-10";
  if (!product.inStock) return <span className={cx("inline-flex items-center rounded-full bg-gray-100 px-4 text-xs font-semibold text-muted", h)}>{t("product.outOfStock")}</span>;
  if (qty <= 0) {
    return (
      <button type="button" disabled={pending} onClick={() => setQty(product.id, product.minQty)} aria-label={t("product.add")}
        className={cx("inline-flex items-center gap-1.5 rounded-full bg-reef-600 px-4 text-sm font-bold text-white shadow-soft transition hover:bg-reef-700 active:scale-95 disabled:opacity-60", h, size === "sm" && "px-3 text-xs")}>
        <Plus className="h-4 w-4" aria-hidden />{size !== "sm" && t("product.add")}
      </button>
    );
  }
  const dec = Math.max(0, qty - product.step);
  return (
    <div className={cx("inline-flex items-center rounded-full border border-reef-200 bg-white shadow-sm", h)} dir="ltr">
      <button type="button" disabled={pending} onClick={() => setQty(product.id, dec < product.minQty ? 0 : dec)} className="flex h-full w-9 items-center justify-center rounded-s-full text-reef-700 hover:bg-mint-100" aria-label="-"><Minus className="h-4 w-4" /></button>
      <span className="num min-w-14 text-center text-sm font-bold">{fmt.qty(qty, product.unit)}</span>
      <button type="button" disabled={pending || (product.maxQty != null && qty >= product.maxQty) || (product.availableQty != null && qty + product.step > product.availableQty)} onClick={() => setQty(product.id, qty + product.step)} className="flex h-full w-9 items-center justify-center rounded-e-full text-reef-700 hover:bg-mint-100 disabled:opacity-40" aria-label="+"><Plus className="h-4 w-4" /></button>
    </div>
  );
}

export function Price({ product, className }: { product: ProductDTO; className?: string }) {
  const { money } = useFmt();
  const { t } = useI18n();
  return (
    <div className={cx("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className="num text-base font-extrabold text-reef-800">{money(product.price)}</span>
      {product.compareAtPrice && <span className="num text-xs text-muted line-through">{money(product.compareAtPrice)}</span>}
      <span className="text-xs text-muted">{t("product.per", { unit: t(`unit.${product.unit}` as MessageKey) })}</span>
    </div>
  );
}

export function ProductCard({ product }: { product: ProductDTO }) {
  const { t } = useI18n();
  const L = useLocalized();
  const img = product.images[0]?.url;
  const off = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-mint-50">
        {img ? <img src={img} alt={L(product, "name")} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /> : <div className="h-full w-full bg-mint-100" />}
        {off > 0 && <span className="absolute top-2 start-2 rounded-full bg-berry px-2 py-0.5 text-[11px] font-bold text-white num">-{off}%</span>}
        {product.lowStock && <span className="absolute bottom-2 start-2 rounded-full bg-sun/90 px-2 py-0.5 text-[11px] font-bold text-white">{t("product.lowStock")}</span>}
      </Link>
      <div className="absolute top-2 end-2"><WishButton productId={product.id} /></div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-bold leading-5 text-ink hover:text-reef-700">{L(product, "name")}</Link>
        {product.origin && <span className="text-[11px] text-muted">{product.origin}</span>}
        <div className="mt-auto flex items-end justify-between gap-2">
          <Price product={product} />
          <QtyStepper product={product} size="sm" />
        </div>
      </div>
    </article>
  );
}
