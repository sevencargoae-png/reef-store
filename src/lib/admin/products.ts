import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api";
import { qtyDec, qtyNum } from "@/lib/money";

const money = z.number().min(0).max(1_000_000);
const qty = z.number().min(0).max(1_000_000);
export const productSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/), sku: z.string().max(40).nullable().optional(), kind: z.enum(["SIMPLE", "BUNDLE"]).default("SIMPLE"),
  nameAr: z.string().min(1), nameEn: z.string().min(1), descAr: z.string().nullable().optional(), descEn: z.string().nullable().optional(),
  categoryId: z.string().min(1), supplierId: z.string().nullable().optional(),
  unit: z.enum(["KG", "PIECE", "BUNCH", "PACK", "BOX"]).default("KG"), step: z.number().positive().max(1000).default(1), minQty: z.number().positive().max(1000).default(1), maxQty: z.number().positive().max(10000).nullable().optional(),
  approxWeightKg: z.number().positive().nullable().optional(), soldByActualWeight: z.boolean().default(false),
  price: money, compareAtPrice: money.nullable().optional(), costPrice: money.nullable().optional(), vatApplicable: z.boolean().default(true),
  trackStock: z.boolean().default(true), stockQty: qty.optional(), lowStockThreshold: qty.default(5),
  origin: z.string().nullable().optional(), tags: z.array(z.string()).default([]), isActive: z.boolean().default(true), isFeatured: z.boolean().default(false), sort: z.number().int().default(0),
  images: z.array(z.string()).max(8).default([]),
  bundleItems: z.array(z.object({ productId: z.string(), qty: z.number().positive() })).max(50).default([]),
});
export type ProductInput = z.infer<typeof productSchema>;

export const adminProductInclude = { category: { select: { nameAr: true, nameEn: true, slug: true } }, supplier: { select: { name: true } }, images: { orderBy: { sort: "asc" as const } }, bundleItems: { include: { component: { select: { id: true, nameAr: true, nameEn: true, unit: true } } } } } satisfies Prisma.ProductInclude;

function data(i: Partial<ProductInput>) {
  const { images, bundleItems, stockQty, ...rest } = i;
  void images; void bundleItems;
  return { ...rest, ...(stockQty !== undefined ? { stockQty: qtyDec(stockQty) } : {}) };
}

export async function createProduct(i: ProductInput, byUserId: string) {
  if (i.kind === "BUNDLE" && !i.bundleItems.length) throw new ApiError(422, "VALIDATION", "Bundle needs components");
  const { images, bundleItems, stockQty, ...rest } = i;
  return prisma.$transaction(async (tx) => {
    const p = await tx.product.create({ data: { ...rest, stockQty: qtyDec(stockQty ?? 0), images: { create: images.map((url, sort) => ({ url, sort })) }, bundleItems: { create: bundleItems.map((b) => ({ componentId: b.productId, qty: qtyDec(b.qty) })) } }, include: adminProductInclude });
    if ((stockQty ?? 0) > 0) await tx.stockMovement.create({ data: { productId: p.id, delta: qtyDec(stockQty!), reason: "RECEIVE", byUserId } });
    return p;
  });
}

export async function updateProduct(id: string, i: Partial<ProductInput>, byUserId: string) {
  const before = await prisma.product.findUnique({ where: { id }, include: adminProductInclude });
  if (!before) throw new ApiError(404, "NOT_FOUND");
  return prisma.$transaction(async (tx) => {
    const { stockQty, ...rest } = i;
    await tx.product.update({ where: { id }, data: data(rest) });
    if (stockQty !== undefined && qtyNum(before.stockQty) !== qtyNum(stockQty)) {
      await tx.product.update({ where: { id }, data: { stockQty: qtyDec(stockQty) } });
      await tx.stockMovement.create({ data: { productId: id, delta: qtyDec(stockQty - qtyNum(before.stockQty)), reason: "ADJUST", note: "set via product form", byUserId } });
    }
    if (i.images) { await tx.productImage.deleteMany({ where: { productId: id } }); await tx.productImage.createMany({ data: i.images.map((url, sort) => ({ productId: id, url, sort })) }); }
    if (i.bundleItems) { await tx.bundleItem.deleteMany({ where: { bundleId: id } }); await tx.bundleItem.createMany({ data: i.bundleItems.filter((b) => b.productId !== id).map((b) => ({ bundleId: id, componentId: b.productId, qty: qtyDec(b.qty) })) }); }
    return tx.product.findUniqueOrThrow({ where: { id }, include: adminProductInclude });
  });
}

export async function adjustStock(id: string, delta: number, reason: string, note: string | null, byUserId: string) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id } });
    if (!p) throw new ApiError(404, "NOT_FOUND");
    if (qtyNum(p.stockQty) + delta < 0) throw new ApiError(409, "OUT_OF_STOCK");
    await tx.product.update({ where: { id }, data: { stockQty: { increment: qtyDec(delta) } } });
    await tx.stockMovement.create({ data: { productId: id, delta: qtyDec(delta), reason, note, byUserId } });
    return tx.product.findUniqueOrThrow({ where: { id }, include: adminProductInclude });
  });
}
