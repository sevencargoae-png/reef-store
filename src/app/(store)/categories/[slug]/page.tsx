import { Suspense } from "react";
import { notFound } from "next/navigation";
import { listCategories, listProducts, type SortKey } from "@/lib/services/catalog";
import { getT } from "@/lib/i18n/server";
import { CatalogToolbar, CategoryChips, Pagination, ProductGrid } from "@/components/store/catalog";

export default async function CategoryPage({ params, searchParams }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  const { t, locale } = await getT();
  const cats = await listCategories();
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) notFound();
  const res = await listProducts({ category: slug, offers: g("offers") === "1", inStock: g("inStock") === "1", sort: g("sort") as SortKey, page: Number(g("page") ?? 1) });
  return (
    <div className="py-6">
      <div className="mb-4 flex items-center gap-4">
        {cat.image && <img src={cat.image} alt="" className="plant-img hidden h-24 w-24 object-contain md:block" />}
        <div>
          <h1 className="text-2xl font-extrabold text-reef-800">{locale === "ar" ? cat.nameAr : cat.nameEn}</h1>
          {(locale === "ar" ? cat.descAr : cat.descEn) && <p className="text-sm text-muted">{locale === "ar" ? cat.descAr : cat.descEn}</p>}
        </div>
      </div>
      <CategoryChips categories={cats} active={slug} />
      <Suspense><CatalogToolbar total={res.meta.total} /></Suspense>
      <ProductGrid products={res.items} emptyText={t("catalog.noResults")} />
      <Suspense><Pagination page={res.meta.page} pages={res.meta.pages} /></Suspense>
    </div>
  );
}
