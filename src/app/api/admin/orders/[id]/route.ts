import { ApiError, handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOrder } from "@/lib/services/orders";
import { toFils, qtyNum } from "@/lib/money";
export const GET = handler<{ params: Promise<{ id: string }> }>(async (_r, { params }) => {
  await requireStaff("orders.read");
  const { id } = await params;
  const o = await getOrder(id);
  if (!o) throw new ApiError(404, "NOT_FOUND");
  // cost snapshot for staff only
  const items = await prisma.orderItem.findMany({ where: { orderId: id }, select: { id: true, costPrice: true, qty: true, actualQty: true } });
  const cost = items.reduce((s, i) => s + Math.round(toFils(i.costPrice) * (i.actualQty ? qtyNum(i.actualQty) : qtyNum(i.qty))), 0);
  return ok({ ...o, cost, costByItem: Object.fromEntries(items.map((i) => [i.id, toFils(i.costPrice)])) });
});
