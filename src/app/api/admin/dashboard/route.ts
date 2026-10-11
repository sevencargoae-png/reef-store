import { handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toFils } from "@/lib/money";
import { orderInclude, orderToDTO } from "@/lib/services/orders";
import { addDays, uaeToday } from "@/lib/services/delivery";

export const GET = handler(async () => {
  await requireStaff("orders.read");
  const today = uaeToday(); const start = new Date(`${today}T00:00:00Z`); start.setUTCHours(-4);
  const weekAgo = new Date(start.getTime() - 6 * 86_400_000);
  const [ordersToday, pending, weekOrders, lowStock, tomorrow, customers, recent] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: start } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({ where: { createdAt: { gte: weekAgo }, status: { not: "CANCELLED" } }, select: { total: true, finalTotal: true } }),
    prisma.product.findMany({ where: { isActive: true, trackStock: true, stockQty: { lte: prisma.product.fields.lowStockThreshold } }, select: { id: true, nameAr: true, nameEn: true, stockQty: true, unit: true }, take: 10, orderBy: { stockQty: "asc" } }),
    prisma.order.count({ where: { deliveryDate: new Date(`${addDays(today, 1)}T00:00:00Z`), status: { not: "CANCELLED" } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  return ok({ ordersToday, pending, revenueWeek: weekOrders.reduce((s, o) => s + toFils(o.finalTotal ?? o.total), 0), lowStock: lowStock.map((p) => ({ ...p, stockQty: Number(p.stockQty) })), tomorrow, customers, recent: recent.map(orderToDTO) });
});
