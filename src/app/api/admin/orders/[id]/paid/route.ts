import { handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getOrder } from "@/lib/services/orders";
export const POST = handler<{ params: Promise<{ id: string }> }>(async (_r, { params }) => {
  const u = await requireStaff("orders.write");
  const { id } = await params;
  await prisma.order.update({ where: { id }, data: { paymentStatus: "PAID" } });
  await prisma.orderEvent.create({ data: { orderId: id, type: "PAYMENT", note: "PAID", byUserId: u.id } });
  await audit({ userId: u.id, action: "order.paid", entity: "Order", entityId: id });
  return ok(await getOrder(id));
});
