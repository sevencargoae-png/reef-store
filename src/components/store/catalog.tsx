"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import type { CategoryDTO, ProductDTO } from "@/lib/services/catalog";
import { ProductCard } from "./product-card";
import { Select } from "@/components/ui/form";
import { cx } from "@/components/ui/cx";

export function CategoryChips({ categories, active }: { categories: CategoryDTO[]; active?: string }) {
  const { t } = useI18n();
  const L = useLocalized();
  return (
    <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <Link href="/products" className={cx("shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold", !active ? "border-reef-600 bg-reef-600 text-white" : "border-reef-200 bg-white text-ink hover:bg-mint-50")}>{t("common.all")}</Link>
      {categories.map((c) => (
        <Link key={c.id} href={`/categories/${c.slug}`} className={cx("shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold", active === c.slug ? "border-reef-600 bg-reef-600 text-white" : "border-reef-200 bg-white text-ink hover:bg-mint-50")}>{L(c, "name")}</Link>
      ))}
    </div>
  );
}

export function CatalogToolbar({ total }: { total: number }) {
  const { t } = useI18n();
  const sp = useSearchParams();
  const router = useRouter();
  const set = (patch: Record<string, string | null>) => {
    const n = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) { if (v == null || v === "") n.delete(k); else n.set(k, v); }
    n.delete("page");
    router.push(`?${n.toString()}`);
  };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <span className="num text-sm text-muted">{t("catalog.count", { count: total })}</span>
      <div className="ms-auto flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={sp.get("offers") === "1"} onChange={(e) => set({ offers: e.target.checked ? "1" : null })} className="accent-reef-600" />{t("catalog.filter.offers")}</label>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={sp.get("inStock") === "1"} onChange={(e) => set({ inStock: e.target.checked ? "1" : null })} className="accent-reef-600" />{t("catalog.filter.inStock")}</label>
        <Select value={sp.get("sort") ?? "featured"} onChange={(e) => set({ sort: e.target.value })} className="!w-auto !py-1.5" aria-label={t("catalog.filter.sort")}>
          <option value="featured">{t("catalog.sort.featured")}</option>
          <option value="priceAsc">{t("catalog.sort.priceAsc")}</option>
          <option value="priceDesc">{t("catalog.sort.priceDesc")}</option>
          <option value="name">{t("catalog.sort.name")}</option>
        </Select>
      </div>
    </div>
  );
}

export function ProductGrid({ products, emptyText }: { products: ProductDTO[]; emptyText: string }) {
  if (!products.length) return <p className="mt-10 rounded-2xl bg-white p-10 text-center text-muted">{emptyText}</p>;
  return <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>;
}

export function Pagination({ page, pages }: { page: number; pages: number }) {
  const { t } = useI18n();
  const sp = useSearchParams();
  if (pages <= 1) return null;
  const href = (p: number) => { const n = new URLSearchParams(sp.toString()); n.set("page", String(p)); return `?${n}`; };
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      {page > 1 && <Link href={href(page - 1)} className="rounded-full border border-reef-200 bg-white px-4 py-1.5 font-semibold">{t("common.prev")}</Link>}
      <span className="num text-muted">{t("common.page", { page, pages })}</span>
      {page < pages && <Link href={href(page + 1)} className="rounded-full border border-reef-200 bg-white px-4 py-1.5 font-semibold">{t("common.next")}</Link>}
    </div>
  );
}
