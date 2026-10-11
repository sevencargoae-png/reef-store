"use client";
import Link from "next/link";
import { Scale } from "lucide-react";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import type { ProductDTO } from "@/lib/services/catalog";
import { Price, QtyStepper } from "./product-card";
import { WishButton } from "./wish-button";
import { useFmt } from "@/lib/use-format";

export function ProductDetail({ product }: { product: ProductDTO }) {
  const { t } = useI18n();
  const L = useLocalized();
  const fmt = useFmt();
  const img = product.images[0]?.url;
  return (
    <div className="grid gap-6 py-6 md:grid-cols-2 md:gap-10">
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-card">
        {img ? <img src={img} alt={L(product, "name")} className="aspect-square w-full object-cover" /> : <div className="aspect-square bg-mint-100" />}
        <div className="absolute top-3 end-3"><WishButton productId={product.id} /></div>
      </div>
      <div>
        <Link href={`/categories/${product.categorySlug}`} className="text-sm font-semibold text-reef-700">{L(product, "categoryName")}</Link>
        <h1 className="mt-1 text-2xl font-extrabold text-ink md:text-3xl">{L(product, "name")}</h1>
        {L(product, "desc") && <p className="mt-3 leading-7 text-muted">{L(product, "desc")}</p>}
        <Price product={product} className="mt-4 text-xl" />
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {product.origin && <><dt className="text-muted">{t("product.origin")}</dt><dd className="font-semibold">{product.origin}</dd></>}
          <dt className="text-muted">{t("product.qty")}</dt><dd className="num font-semibold">{fmt.qty(product.step, product.unit)}{product.approxWeightKg ? ` (~${product.approxWeightKg} kg)` : ""}</dd>
          {product.availableQty != null && product.lowStock && <><dt className="text-muted">{t("common.status")}</dt><dd className="font-semibold text-sun">{t("product.lowStock")}</dd></>}
        </dl>
        {product.soldByActualWeight && <p className="mt-3 flex items-center gap-2 rounded-xl bg-mint-100 px-3 py-2 text-xs font-semibold text-reef-800"><Scale className="h-4 w-4" aria-hidden />{t("product.weightNote")}</p>}
        <div className="mt-6"><QtyStepper product={product} size="lg" /></div>
        {product.bundleItems?.length ? (
          <div className="mt-6 rounded-2xl bg-white p-4 shadow-card">
            <h2 className="font-extrabold">{t("product.bundleContents")}</h2>
            <ul className="mt-2 grid gap-1 text-sm">{product.bundleItems.map((b) => <li key={b.productId} className="flex justify-between"><span>{L(b, "name")}</span><span className="num text-muted">{fmt.qty(b.qty, b.unit)}</span></li>)}</ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
