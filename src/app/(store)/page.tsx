import { listCategories, listProducts } from "@/lib/services/catalog";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";
import { Features, Hero, PlantGrid, ProductRow } from "@/components/store/home";

export default async function HomePage() {
  const { t, locale } = await getT();
  const [cats, featured, offers, settings] = await Promise.all([
    listCategories(), listProducts({ pageSize: 10 }), listProducts({ offers: true, pageSize: 5 }), getSettings(),
  ]);
  const promise = locale === "ar" ? settings.deliveryPromiseAr : settings.deliveryPromiseEn;
  const home = cats.filter((c) => c.showOnHome && c.productCount > 0).slice(0, 6);
  return (
    <div className="pb-8">
      <Hero promise={promise} />
      {home.length ? <PlantGrid categories={home} /> : <p className="mt-10 text-center text-muted">{t("home.empty")}</p>}
      <Features promise={promise} />
      <ProductRow title={t("home.offers")} href="/offers" products={offers.items} />
      <ProductRow title={t("home.featured")} href="/products" products={featured.items.filter((p) => p.isFeatured)} />
    </div>
  );
}
