import Link from "next/link";
import { listCategories } from "@/lib/services/catalog";
import { getT } from "@/lib/i18n/server";

export default async function CategoriesPage() {
  const { t, locale } = await getT();
  const cats = await listCategories();
  return (
    <div className="py-6">
      <h1 className="mb-1 text-2xl font-extrabold text-reef-800">{t("home.sections")}</h1>
      <p className="mb-5 text-sm text-muted">{t("home.sections.sub")}</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {cats.map((c) => (
          <Link key={c.id} href={`/categories/${c.slug}`} className="plant-btn group flex flex-col items-center rounded-3xl bg-white/60 p-3 text-center">
            <div className="h-40 w-full md:h-52">{c.image ? <img src={c.image} alt="" className="plant-img h-full w-full object-contain object-bottom" /> : null}</div>
            <h2 className="mt-2 font-extrabold text-ink group-hover:text-reef-700">{locale === "ar" ? c.nameAr : c.nameEn}</h2>
            <p className="num text-xs text-muted">{t("home.products", { count: c.productCount })}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
