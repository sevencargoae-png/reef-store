import { Suspense } from "react";
import { catalogIndex, listCategories, listProducts, type SortKey } from "@/lib/services/catalog";
import { searchProducts } from "@/lib/services/search";
import { getT } from "@/lib/i18n/server";
import { CatalogToolbar, CategoryChips, Pagination, ProductGrid } from "@/components/store/catalog";

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const sp = await searchParams;
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  const { t } = await getT();
  const q = g("q");
  const [cats, dbRes] = await Promise.all([listCategories(), listProducts({ q, offers: g("offers") === "1", inStock: g("inStock") === "1", sort: g("sort") as SortKey, page: Number(g("page") ?? 1) })]);
  // natural-language fallback: "كيلو طماطم وخيار" → normalized token search over names/tags
  const res = q && dbRes.meta.total === 0 ? (() => null)() : dbRes;
  const nl = res ? null : searchProducts(q!, await catalogIndex());
  const items = res ? res.items : nl!;
  const meta = res ? res.meta : { page: 1, pages: 1, total: nl!.length };
  return (
    <div className="py-6">
      <h1 className="mb-4 text-2xl font-extrabold text-reef-800">{q ? t("catalog.search", { q }) : t("catalog.all")}</h1>
      <CategoryChips categories={cats} />
      <Suspense><CatalogToolbar total={meta.total} /></Suspense>
      <ProductGrid products={items} emptyText={t("catalog.noResults")} />
      <Suspense><Pagination page={meta.page} pages={meta.pages} /></Suspense>
    </div>
  );
}
