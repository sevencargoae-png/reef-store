"use client";
import Link from "next/link";
import { ArrowLeft, HandHeart, Leaf, ShieldCheck, ShieldPlus, Sprout, Truck } from "lucide-react";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import type { CategoryDTO, ProductDTO } from "@/lib/services/catalog";
import { ProductCard } from "./product-card";
import { PlantVisual, ProduceImage } from "./plant";
import { WaterRain } from "./water-rain";
import { cx } from "@/components/ui/cx";

function SectionHead({ title, href }: { title: string; href?: string }) {
  const { t } = useI18n();
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-reef-900 md:text-2xl"><Leaf className="h-5 w-5 text-reef-500" aria-hidden />{title}</h2>
      {href && <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-reef-700 hover:underline">{t("home.viewAll")}<ArrowLeft className="h-4 w-4 ltr:rotate-180" aria-hidden /></Link>}
    </div>
  );
}

/** Banner over a real UAE farm at sunrise, with live plants you can touch. */
export function HeroBanner() {
  const { t } = useI18n();
  const feats = [
    { icon: ShieldCheck, label: t("hero.f1") },
    { icon: ShieldPlus, label: t("hero.f2") },
    { icon: Truck, label: t("hero.f3") },
    { icon: HandHeart, label: t("hero.f4") },
  ];
  return (
    <section className="relative mt-3 md:mt-5">
      <div className="hero-banner relative isolate overflow-hidden rounded-[28px] shadow-soft">
        <picture>
          <source media="(max-width: 767px)" srcSet="/img/farm-hero-960.webp" />
          <img src="/img/farm-hero.webp" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-[30%_70%]" fetchPriority="high" />
        </picture>
        <div className="hero-veil absolute inset-0 -z-10" aria-hidden />
        <WaterRain density={0.7} />
        <div className="relative z-[3] flex min-h-[250px] max-w-[64%] flex-col justify-center gap-2 p-4 pb-10 md:min-h-[360px] md:max-w-[56%] md:p-10">
          <h1 className="text-[24px] font-extrabold leading-[1.3] text-reef-900 md:text-5xl">
            <span className="flex items-center gap-2"><Leaf className="h-7 w-7 text-reef-500 md:h-10 md:w-10" aria-hidden />{t("hero.title1")}</span>
            <span className="block">{t("hero.title2")}</span>
          </h1>
          <p className="text-sm font-semibold text-reef-900/80 md:text-xl">{t("hero.sub")}</p>
          <Link href="/products" className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-reef-700 px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-reef-800 active:scale-95 md:text-base">
            {t("hero.cta")}<ArrowLeft className="h-4 w-4 ltr:rotate-180" aria-hidden />
          </Link>
        </div>
        {/* live plants at the far side of the banner */}
        <div className="pointer-events-none absolute bottom-4 end-0 z-[2] flex w-[58%] items-end justify-end md:bottom-0 md:w-[44%]">
          <div className="pointer-events-auto w-1/2 translate-y-[6%]"><PlantVisual plant="citrus" alt="" idle eager sizes="(max-width: 768px) 24vw, 20vw" /></div>
          <div className="pointer-events-auto -ms-[12%] w-[62%] translate-y-[4%]"><PlantVisual plant="tomato" alt="" idle eager sizes="(max-width: 768px) 28vw, 26vw" /></div>
        </div>
      </div>
      <ul className="relative z-[4] mx-auto -mt-6 flex w-[calc(100%-1.5rem)] gap-2 overflow-x-auto rounded-2xl border border-white/70 bg-white/90 p-2 shadow-card backdrop-blur hide-scrollbar md:-mt-8 md:w-[min(900px,92%)] md:justify-between md:gap-0 md:divide-x md:divide-reef-100 md:p-3 md:rtl:divide-x-reverse">
        {feats.map((f) => (
          <li key={f.label} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 md:flex-1 md:justify-center">
            <f.icon className="h-5 w-5 text-reef-600" aria-hidden /><span className="whitespace-nowrap text-xs font-bold text-ink md:text-sm">{f.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Every category as a small live-plant icon — the whole range visible at a glance. */
export function CategoryStrip({ categories }: { categories: CategoryDTO[] }) {
  const { t } = useI18n();
  const L = useLocalized();
  return (
    <section className="mt-6">
      <SectionHead title={t("home.allCats")} href="/categories" />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 hide-scrollbar md:mx-0 md:grid md:grid-cols-9 md:gap-3 md:px-0">
        {categories.map((c, i) => (
          <Link key={c.id} href={`/categories/${c.slug}`} className="group flex w-[76px] shrink-0 flex-col items-center gap-1 text-center md:w-auto">
            <span className="cat-bubble flex h-[72px] w-[72px] items-center justify-center rounded-full md:h-[84px] md:w-[84px]">
              <span className="h-[86%] w-[86%]"><ProduceImage url={c.image} alt={L(c, "name")} variant="icon" eager={i < 6} /></span>
            </span>
            <span className="line-clamp-2 text-[11.5px] font-bold leading-4 text-ink group-hover:text-reef-700 md:text-sm">{L(c, "name")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A row of products: swipeable rail on phones, grid on desktop. */
export function ProductRail({ title, href, products, className }: { title: string; href: string; products: ProductDTO[]; className?: string }) {
  if (!products.length) return null;
  return (
    <section className={cx("mt-7", className)}>
      <SectionHead title={title} href={href} />
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
        {products.map((p) => <div key={p.id} className="w-[44vw] max-w-[220px] shrink-0 snap-start sm:w-auto sm:max-w-none"><ProductCard product={p} /></div>)}
      </div>
    </section>
  );
}
export const ProductRow = ProductRail;

const TILE_POS = ["20% 70%", "45% 65%", "70% 75%", "85% 60%", "55% 80%", "10% 60%"];
/** Category tiles over the farm photo (desktop), like walking between the fields. */
export function CategoryTiles({ categories }: { categories: CategoryDTO[] }) {
  const { t } = useI18n();
  const L = useLocalized();
  return (
    <section className="mt-8 hidden md:block">
      <SectionHead title={t("home.byCategory")} href="/categories" />
      <div className="grid grid-cols-5 gap-3">
        {categories.slice(0, 5).map((c, i) => (
          <Link key={c.id} href={`/categories/${c.slug}`} className="cat-tile group relative isolate flex h-36 items-end overflow-hidden rounded-2xl p-3 text-white shadow-card">
            <img src="/img/farm-hero-960.webp" alt="" className="absolute inset-0 -z-20 h-full w-full scale-125 object-cover blur-[1px] transition duration-700 group-hover:scale-[1.32]" style={{ objectPosition: TILE_POS[i % TILE_POS.length] }} loading="lazy" />
            <span className="absolute inset-0 -z-10 bg-gradient-to-t from-reef-900/85 via-reef-900/30 to-transparent" aria-hidden />
            <span className="absolute -top-2 end-1 h-24 w-24 drop-shadow-lg"><ProduceImage url={c.image} alt={L(c, "name")} variant="icon" /></span>
            <span><span className="block text-lg font-extrabold leading-6">{L(c, "name")}</span><span className="num text-xs text-white/85">{t("home.products", { count: c.productCount })}</span></span>
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
    <section className="mt-8 grid grid-cols-2 gap-3 md:mt-12 md:grid-cols-4">
      {items.map((it) => (
        <div key={it.title} className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-card md:justify-center md:px-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint-100 text-reef-700"><it.icon className="h-5 w-5" aria-hidden /></span>
          <div><div className="text-sm font-extrabold text-ink">{it.title}</div>{it.sub && <div className="text-xs text-muted">{it.sub}</div>}</div>
        </div>
      ))}
    </section>
  );
}
