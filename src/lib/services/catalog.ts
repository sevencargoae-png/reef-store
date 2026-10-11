import { prisma } from "@/lib/db";
import { toFils, qtyNum } from "@/lib/money";
import type { Prisma } from "@/generated/prisma/client";
import type { Unit, ProductKind } from "@/generated/prisma/enums";

/** Plain, client-safe product shape (money in fils, quantities as numbers). Never exposes costPrice. */
export interface ProductDTO {
  id: string; slug: string; sku: string | null; kind: ProductKind;
  nameAr: string; nameEn: string; descAr: string | null; descEn: string | null;
  categoryId: string; categorySlug: string; categoryNameAr: string; categoryNameEn: string;
  unit: Unit; step: number; minQty: number; maxQty: number | null; approxWeightKg: number | null; soldByActualWeight: boolean;
  price: number; compareAtPrice: number | null; vatApplicable: boolean;
  inStock: boolean; lowStock: boolean; availableQty: number | null;
  origin: string | null; tags: string[]; isFeatured: boolean;
  images: { url: string; alt: string | null }[];
  bundleItems?: { productId: string; nameAr: string; nameEn: string; qty: number; unit: Unit }[];
}

export const productInclude = {
  category: { select: { slug: true, nameAr: true, nameEn: true } },
  images: { orderBy: { sort: "asc" as const } },
  bundleItems: { include: { component: { select: { id: true, nameAr: true, nameEn: true, unit: true } } } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function toDTO(p: ProductRow): ProductDTO {
  const stock = qtyNum(p.stockQty);
  const inStock = !p.trackStock || stock >= qtyNum(p.minQty);
  return {
    id: p.id, slug: p.slug, sku: p.sku, kind: p.kind,
    nameAr: p.nameAr, nameEn: p.nameEn, descAr: p.descAr, descEn: p.descEn,
    categoryId: p.categoryId, categorySlug: p.category.slug, categoryNameAr: p.category.nameAr, categoryNameEn: p.category.nameEn,
    unit: p.unit, step: qtyNum(p.step), minQty: qtyNum(p.minQty), maxQty: p.maxQty ? qtyNum(p.maxQty) : null,
    approxWeightKg: p.approxWeightKg ? qtyNum(p.approxWeightKg) : null, soldByActualWeight: p.soldByActualWeight,
    price: toFils(p.price), compareAtPrice: p.compareAtPrice ? toFils(p.compareAtPrice) : null, vatApplicable: p.vatApplicable,
    inStock, lowStock: p.trackStock && inStock && stock <= qtyNum(p.lowStockThreshold), availableQty: p.trackStock ? stock : null,
    origin: p.origin, tags: p.tags, isFeatured: p.isFeatured,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    bundleItems: p.kind === "BUNDLE" ? p.bundleItems.map((b) => ({ productId: b.componentId, nameAr: b.component.nameAr, nameEn: b.component.nameEn, qty: qtyNum(b.qty), unit: b.component.unit })) : undefined,
  };
}

export interface CategoryDTO { id: string; slug: string; nameAr: string; nameEn: string; descAr: string | null; descEn: string | null; image: string | null; productCount: number; showOnHome: boolean; sort: number }

export async function listCategories(opts: { onlyActive?: boolean } = { onlyActive: true }): Promise<CategoryDTO[]> {
  const cats = await prisma.category.findMany({
    where: opts.onlyActive ? { active: true } : {},
    orderBy: { sort: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  return cats.map((c) => ({ id: c.id, slug: c.slug, nameAr: c.nameAr, nameEn: c.nameEn, descAr: c.descAr, descEn: c.descEn, image: c.image, productCount: c._count.products, showOnHome: c.showOnHome, sort: c.sort }));
}

export type SortKey = "featured" | "priceAsc" | "priceDesc" | "name";
export interface ListParams { q?: string; category?: string; offers?: boolean; inStock?: boolean; sort?: SortKey; page?: number; pageSize?: number; ids?: string[] }

export async function listProducts(params: ListParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, params.pageSize ?? 24));
  const where: Prisma.ProductWhereInput = { isActive: true, category: { active: true } };
  if (params.category) where.category = { slug: params.category, active: true };
  if (params.offers) where.compareAtPrice = { not: null };
  if (params.inStock) where.OR = [{ trackStock: false }, { stockQty: { gt: 0 } }];
  if (params.ids) where.id = { in: params.ids };
  if (params.q?.trim()) {
    const q = params.q.trim();
    where.AND = [{ OR: [
      { nameAr: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } },
      { descAr: { contains: q, mode: "insensitive" } }, { descEn: { contains: q, mode: "insensitive" } },
      { tags: { hasSome: q.toLowerCase().split(/\s+/) } },
      { category: { OR: [{ nameAr: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } }] } },
    ] }];
  }
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    params.sort === "priceAsc" ? [{ price: "asc" }] : params.sort === "priceDesc" ? [{ price: "desc" }] : params.sort === "name" ? [{ nameAr: "asc" }] : [{ isFeatured: "desc" }, { sort: "asc" }, { nameAr: "asc" }];
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, include: productInclude, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.product.count({ where }),
  ]);
  return { items: rows.map(toDTO), meta: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } };
}

export async function getProductBySlug(slug: string) {
  const p = await prisma.product.findFirst({ where: { slug, isActive: true }, include: productInclude });
  return p ? toDTO(p) : null;
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, include: productInclude });
  return rows.map(toDTO);
}

/** Lightweight catalog used by the assistant: all active products with search terms. */
export async function catalogIndex() {
  const rows = await prisma.product.findMany({ where: { isActive: true, category: { active: true } }, include: productInclude, orderBy: { sort: "asc" } });
  return rows.map(toDTO);
}
