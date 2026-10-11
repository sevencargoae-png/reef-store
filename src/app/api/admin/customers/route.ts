import { handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
export const GET = handler(async (req) => {
  await requireStaff("customers.read");
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1)); const pageSize = 50;
  const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
  const q = sp.get("q")?.trim();
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/\D/g, "").slice(-9) || q } }, { email: { contains: q, mode: "insensitive" } }];
  const [rows, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, name: true, phone: true, email: true, status: true, createdAt: true, householdSize: true, _count: { select: { orders: true } }, orders: { where: { status: { not: "CANCELLED" } }, select: { total: true, finalTotal: true, createdAt: true }, orderBy: { createdAt: "desc" } } } }),
    prisma.user.count({ where }),
  ]);
  const items = rows.map((r) => ({ id: r.id, name: r.name, phone: r.phone, email: r.email, status: r.status, createdAt: r.createdAt, householdSize: r.householdSize, ordersCount: r._count.orders, totalSpent: r.orders.reduce((s, o) => s + Math.round(Number(o.finalTotal ?? o.total) * 100), 0), lastOrderAt: r.orders[0]?.createdAt ?? null }));
  return ok({ items, meta: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } });
});
