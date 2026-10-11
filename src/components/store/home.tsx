"use client";
import Link from "next/link";
import { Leaf, ShieldCheck, Sprout, Truck, ArrowLeft } from "lucide-react";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import type { CategoryDTO, ProductDTO } from "@/lib/services/catalog";
import { ProductCard } from "./product-card";
import { cx } from "@/components/ui/cx";

export function Hero({ promise }: { promise: string }) {
  const { t } = useI18n();
  return (
    <section className="fade-up pt-8 text-center md:pt-14">
      <h1 className="text-3xl font-extrabold leading-tight text-reef-800 md:text-5xl">{t("brand.tagline")}</h1>
      <p className="mt-3 text-base text-muted md:text-xl">{t("brand.sub")}</p>
      {promise && <p className="mt-2 inline-block rounded-full bg-mint-100 px-4 py-1 text-sm font-semibold text-reef-800">{promise}</p>}
    </section>
  );
}

/** The plant itself is the button (no card) — the central idea of the reference design. */
export function PlantGrid({ categories }: { categories: CategoryDTO[] }) {
  const { t } = useI18n();
  const L = useLocalized();
  return (
    <section className="relative mt-6 md:mt-10" aria-label={t("home.sections")}>
      <div className="mb-2 text-center md:hidden">
        <h2 className="text-2xl font-extrabold text-reef-800">{t("home.sections")}</h2>
        <p className="text-sm text-muted">{t("home.sections.sub")}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:flex md:items-end md:justify-between md:gap-2">
        {categories.map((c, i) => (
          <Link key={c.id} href={`/categories/${c.slug}`} className="plant-btn group relative flex flex-col items-center rounded-3xl text-center outline-none md:flex-1" style={{ animationDelay: `${i * 60}ms` }}>
            {i === 0 && (
              <span className="absolute -top-2 start-1/2 z-10 hidden -translate-x-1/2 rtl:translate-x-1/2 whitespace-nowrap rounded-full bg-reef-700 px-3 py-1 text-xs font-bold text-white shadow-soft md:block">{t("home.tapHint")}</span>
            )}
            <div className="relative h-44 w-full md:h-64 lg:h-72">
              {c.image ? <img src={c.image} alt="" className="plant-img h-full w-full object-contain object-bottom" loading={i < 3 ? "eager" : "lazy"} /> : <div className="h-full w-full rounded-full bg-mint-100" />}
              {i === 0 && <span className="tap-ring absolute bottom-16 start-1/2 h-10 w-10 -translate-x-1/2 rtl:translate-x-1/2 rounded-full" aria-hidden />}
            </div>
            <h3 className="mt-1 text-sm font-extrabold text-ink group-hover:text-reef-700 md:text-base">{L(c, "name")}</h3>
            <p className="num text-xs text-muted">{t("home.products", { count: c.productCount })}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Features({ promise }: { promise: string }) {
  const { t } = useI18n();
  const items = [
    { icon: Leaf, title: t("home.why.fresh"), sub: promise },
    { icon: ShieldCheck, title: t("home.why.quality"), sub: t("home.why.quality.sub") },
    { icon: Sprout, title: t("home.why.farmers"), sub: t("home.why.farmers.sub") },
    { icon: Truck, title: t("home.why.cold"), sub: t("home.why.cold.sub") },
  ];
  return (
    <section className="mt-8 grid grid-cols-2 gap-3 md:mt-12 md:grid-cols-4 md:gap-0 md:divide-x md:divide-reef-100 md:rtl:divide-x-reverse">
      {items.map((it) => (
        <div key={it.title} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 md:justify-center md:bg-transparent md:px-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint-100 text-reef-700"><it.icon className="h-5 w-5" aria-hidden /></span>
          <div><div className="text-sm font-extrabold text-ink">{it.title}</div>{it.sub && <div className="text-xs text-muted">{it.sub}</div>}</div>
        </div>
      ))}
    </section>
  );
}

export function ProductRow({ title, href, products, className }: { title: string; href: string; products: ProductDTO[]; className?: string }) {
  const { t } = useI18n();
  if (!products.length) return null;
  return (
    <section className={cx("mt-10", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-reef-800 md:text-2xl">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-reef-700 hover:underline">{t("home.viewAll")}<ArrowLeft className="h-4 w-4 ltr:rotate-180" aria-hidden /></Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
