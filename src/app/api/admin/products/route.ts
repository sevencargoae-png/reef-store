import { clientIp, handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { audit } from "@/lib/audit";
import { adminProductInclude, createProduct, productSchema } from "@/lib/admin/products";

export const GET = handler(async (req) => {
  await requireStaff("catalog.read");
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1)); const pageSize = 50;
  const where: Prisma.ProductWhereInput = {};
  const q = sp.get("q")?.trim();
  if (q) where.OR = [{ nameAr: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } }, { slug: { contains: q } }, { sku: { contains: q, mode: "insensitive" } }];
  if (sp.get("categoryId")) where.categoryId = sp.get("categoryId")!;
  if (sp.get("lowStock") === "1") where.AND = [{ trackStock: true }, { stockQty: { lte: prisma.product.fields.lowStockThreshold } }];
  if (sp.get("active")) where.isActive = sp.get("active") === "1";
  const [items, total] = await Promise.all([prisma.product.findMany({ where, include: adminProductInclude, orderBy: [{ sort: "asc" }, { nameAr: "asc" }], skip: (page - 1) * pageSize, take: pageSize }), prisma.product.count({ where })]);
  return ok({ items, meta: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } });
});

export const POST = handler(async (req) => {
  const u = await requireStaff("catalog.write");
  const i = await parseBody(req, productSchema);
  const p = await createProduct(i, u.id);
  await audit({ userId: u.id, action: "Product.create", entity: "Product", entityId: p.id, after: i, ip: clientIp(req) });
  return ok(p, { status: 201 });
});
