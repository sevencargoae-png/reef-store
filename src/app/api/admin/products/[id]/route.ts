import { ApiError, clientIp, handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { adminProductInclude, productSchema, updateProduct } from "@/lib/admin/products";

type Ctx = { params: Promise<{ id: string }> };
export const GET = handler<Ctx>(async (_r, { params }) => {
  await requireStaff("catalog.read");
  const p = await prisma.product.findUnique({ where: { id: (await params).id }, include: { ...adminProductInclude, stockMovements: { orderBy: { createdAt: "desc" }, take: 30 } } });
  if (!p) throw new ApiError(404, "NOT_FOUND");
  return ok(p);
});
export const PATCH = handler<Ctx>(async (req, { params }) => {
  const u = await requireStaff("catalog.write");
  const { id } = await params;
  const i = await parseBody(req, productSchema.partial());
  const p = await updateProduct(id, i, u.id);
  await audit({ userId: u.id, action: "Product.update", entity: "Product", entityId: id, after: i, ip: clientIp(req) });
  return ok(p);
});
export const DELETE = handler<Ctx>(async (req, { params }) => {
  const u = await requireStaff("catalog.write");
  const { id } = await params;
  // products referenced by orders are deactivated instead of deleted (history must stay intact)
  const used = await prisma.orderItem.count({ where: { productId: id } });
  if (used) { await prisma.product.update({ where: { id }, data: { isActive: false } }); }
  else await prisma.product.delete({ where: { id } });
  await audit({ userId: u.id, action: used ? "Product.deactivate" : "Product.delete", entity: "Product", entityId: id, ip: clientIp(req) });
  return ok({ ok: true, deactivated: used > 0 });
});
