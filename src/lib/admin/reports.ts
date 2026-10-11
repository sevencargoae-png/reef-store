import { prisma } from "@/lib/db";
import { toFils, qtyNum } from "@/lib/money";

export async function salesReport(from: string, to: string) {
  const start = new Date(`${from}T00:00:00Z`); start.setUTCHours(-4);
  const end = new Date(`${to}T00:00:00Z`); end.setUTCHours(20); // end of UAE day
  const orders = await prisma.order.findMany({ where: { createdAt: { gte: start, lte: end }, status: { not: "CANCELLED" } }, include: { items: true } });
  const byDay = new Map<string, { orders: number; revenue: number; cogs: number }>();
  const byStatus: Record<string, number> = {};
  const byArea = new Map<string, { orders: number; revenue: number }>();
  const products = new Map<string, { nameAr: string; nameEn: string; unit: string; qty: number; revenue: number }>();
  let revenue = 0, cogs = 0, delivery = 0, discount = 0, vat = 0;
  for (const o of orders) {
    const r = toFils(o.finalTotal ?? o.total);
    const c = o.items.reduce((s, i) => s + Math.round(toFils(i.costPrice) * (i.actualQty ? qtyNum(i.actualQty) : qtyNum(i.qty))), 0);
    revenue += r; cogs += c; delivery += toFils(o.deliveryFee); discount += toFils(o.discount); vat += toFils(o.vatAmount);
    const day = new Date(o.createdAt.getTime() + 4 * 3_600_000).toISOString().slice(0, 10);
    const d = byDay.get(day) ?? { orders: 0, revenue: 0, cogs: 0 }; d.orders++; d.revenue += r; d.cogs += c; byDay.set(day, d);
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    const a = byArea.get(o.areaName) ?? { orders: 0, revenue: 0 }; a.orders++; a.revenue += r; byArea.set(o.areaName, a);
    for (const i of o.items) {
      const key = i.productId ?? i.nameAr;
      const p = products.get(key) ?? { nameAr: i.nameAr, nameEn: i.nameEn, unit: i.unit, qty: 0, revenue: 0 };
      p.qty += i.actualQty ? qtyNum(i.actualQty) : qtyNum(i.qty); p.revenue += toFils(i.lineTotal); products.set(key, p);
    }
  }
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  return {
    from, to, orders: orders.length, delivered, revenue, cogs, delivery, discount, vat, profit: revenue - delivery - cogs, avgOrder: orders.length ? Math.round(revenue / orders.length) : 0,
    byDay: [...byDay.entries()].sort().map(([day, v]) => ({ day, ...v })),
    byStatus, byArea: [...byArea.entries()].map(([area, v]) => ({ area, ...v })).sort((a, b) => b.revenue - a.revenue),
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 15),
  };
}
