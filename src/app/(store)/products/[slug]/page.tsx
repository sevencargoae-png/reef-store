import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, listProducts } from "@/lib/services/catalog";
import { getT } from "@/lib/i18n/server";
import { ProductDetail } from "@/components/store/product-detail";
import { ProductRow } from "@/components/store/home";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  return { title: p ? `${p.nameAr} · ${p.nameEn}` : "Reeef" };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const { t } = await getT();
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await listProducts({ category: product.categorySlug, pageSize: 6 });
  return (
    <div>
      <ProductDetail product={product} />
      <ProductRow title={t("product.related")} href={`/categories/${product.categorySlug}`} products={related.items.filter((p) => p.id !== product.id).slice(0, 5)} />
    </div>
  );
}
