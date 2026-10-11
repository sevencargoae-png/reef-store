import { handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { orderInclude, orderToDTO } from "@/lib/services/orders";

export const GET = handler(async (req) => {
  await requireStaff("orders.read");
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1)); const pageSize = 30;
  const where: Prisma.OrderWhereInput = {};
  const q = sp.get("q")?.trim();
  if (q) where.OR = [{ number: { contains: q.toUpperCase() } }, { customerPhone: { contains: q.replace(/\D/g, "").slice(-9) || q } }, { customerName: { contains: q, mode: "insensitive" } }];
  if (sp.get("status")) where.status = sp.get("status") as OrderStatus;
  if (sp.get("date")) where.deliveryDate = new Date(`${sp.get("date")}T00:00:00Z`);
  if (sp.get("userId")) where.userId = sp.get("userId")!;
  const [rows, total] = await Promise.all([prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.order.count({ where })]);
  return ok({ items: rows.map(orderToDTO), meta: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } });
});
