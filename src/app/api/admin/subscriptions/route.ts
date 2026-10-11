import { handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { qtyNum } from "@/lib/money";
export const GET = handler(async (req) => {
  await requireStaff("subscriptions.read");
  const sp = new URL(req.url).searchParams; const page = Math.max(1, Number(sp.get("page") ?? 1)); const pageSize = 50;
  const where = sp.get("status") ? { status: sp.get("status") as "ACTIVE" | "PAUSED" | "CANCELLED" } : {};
  const [rows, total] = await Promise.all([prisma.subscription.findMany({ where, include: { user: { select: { id: true, name: true, phone: true } }, items: { include: { product: { select: { nameAr: true, nameEn: true, unit: true } } } }, slot: true, address: { include: { area: true } }, _count: { select: { orders: true } } }, orderBy: { nextRunAt: "asc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.subscription.count({ where })]);
  const items = rows.map((s) => ({ id: s.id, name: s.name, status: s.status, frequency: s.frequency, weekday: s.weekday, nextRunAt: s.nextRunAt.toISOString().slice(0, 10), lastRunAt: s.lastRunAt, user: s.user, slot: s.slot ? `${s.slot.startTime}–${s.slot.endTime}` : null, area: s.address.area.nameAr, ordersCount: s._count.orders, items: s.items.map((i) => ({ nameAr: i.product.nameAr, nameEn: i.product.nameEn, unit: i.product.unit, qty: qtyNum(i.qty) })) }));
  return ok({ items, meta: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } });
});
