import { z } from "zod";
import { ApiError, clientIp, handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { orderInclude, orderToDTO } from "@/lib/services/orders";
type Ctx = { params: Promise<{ id: string }> };
export const GET = handler<Ctx>(async (_r, { params }) => {
  await requireStaff("customers.read");
  const { id } = await params;
  const u = await prisma.user.findFirst({ where: { id, role: "CUSTOMER" }, select: { id: true, name: true, phone: true, email: true, status: true, createdAt: true, householdSize: true, addresses: { include: { area: true, emirate: true } } } });
  if (!u) throw new ApiError(404, "NOT_FOUND");
  const orders = await prisma.order.findMany({ where: { userId: id }, include: orderInclude, orderBy: { createdAt: "desc" }, take: 50 });
  return ok({ ...u, orders: orders.map(orderToDTO) });
});
export const PATCH = handler<Ctx>(async (req, { params }) => {
  const a = await requireStaff("customers.write");
  const { id } = await params;
  const b = await parseBody(req, z.object({ name: z.string().min(2).max(80).optional(), email: z.string().email().nullable().optional(), status: z.enum(["ACTIVE", "SUSPENDED"]).optional() }));
  const before = await prisma.user.findFirst({ where: { id, role: "CUSTOMER" } });
  if (!before) throw new ApiError(404, "NOT_FOUND");
  const u = await prisma.user.update({ where: { id }, data: b, select: { id: true, name: true, email: true, status: true } });
  if (b.status === "SUSPENDED") await prisma.session.deleteMany({ where: { userId: id } });
  await audit({ userId: a.id, action: "Customer.update", entity: "User", entityId: id, before: { name: before.name, email: before.email, status: before.status }, after: b, ip: clientIp(req) });
  return ok(u);
});
