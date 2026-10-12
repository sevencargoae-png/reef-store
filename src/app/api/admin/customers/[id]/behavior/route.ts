import { handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_r, { params }) => {
  await requireStaff("customers.read");
  const { id } = await params;

  const [totalOrders, deliveredOrders, cancelledOrders, failedDeliveries] = await Promise.all([
    prisma.order.count({ where: { userId: id } }),
    prisma.order.count({ where: { userId: id, status: "DELIVERED" } }),
    prisma.order.count({ where: { userId: id, status: "CANCELLED" } }),
    // Failed deliveries: orders that went OUT_FOR_DELIVERY then got CANCELLED
    prisma.orderEvent.count({
      where: {
        order: { userId: id },
        type: "STATUS",
        fromStatus: "OUT_FOR_DELIVERY",
        toStatus: "CANCELLED",
      },
    }),
  ]);

  return ok({ totalOrders, deliveredOrders, cancelledOrders, failedDeliveries });
});
