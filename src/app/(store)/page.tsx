import { listCategories, listProducts } from "@/lib/services/catalog";
import { getT } from "@/lib/i18n/server";
import { CategoryStrip, CategoryTiles, HeroBanner, ProductRail } from "@/components/store/home";

export default async function HomePage() {
  const { t } = await getT();
  const [cats, featured, offers] = await Promise.all([
    listCategories(), listProducts({ pageSize: 12 }), listProducts({ offers: true, pageSize: 6 }),
  ]);
  const withProducts = cats.filter((c) => c.productCount > 0);
  const homeCats = withProducts.filter((c) => c.showOnHome);
  const fresh = featured.items.filter((p) => p.isFeatured);
  return (
    <div className="pb-10">
      <HeroBanner />
      {withProducts.length ? <CategoryStrip categories={withProducts} /> : <p className="mt-10 text-center text-muted">{t("home.empty")}</p>}
      <ProductRail title={t("home.freshTitle")} href="/products" products={(fresh.length >= 6 ? fresh : featured.items).slice(0, 6)} />
      <CategoryTiles categories={homeCats.length ? homeCats : withProducts} />
      <ProductRail title={t("home.offers")} href="/offers" products={offers.items} />
    </div>
  );
}
