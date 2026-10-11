import { listProducts } from "@/lib/services/catalog";
import { getT } from "@/lib/i18n/server";
import { ProductGrid } from "@/components/store/catalog";

export default async function OffersPage() {
  const { t } = await getT();
  const res = await listProducts({ offers: true, pageSize: 60 });
  return (
    <div className="py-6">
      <h1 className="mb-4 text-2xl font-extrabold text-reef-800">{t("offers.title")}</h1>
      <ProductGrid products={res.items} emptyText={t("offers.empty")} />
    </div>
  );
}
