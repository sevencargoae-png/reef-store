import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOrder } from "@/lib/services/orders";
export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const u = await requireStaff("orders.write");
  const { id } = await params;
  const b = await parseBody(req, z.object({ note: z.string().min(1).max(500) }));
  await prisma.orderEvent.create({ data: { orderId: id, type: "NOTE", note: b.note, byUserId: u.id } });
  return ok(await getOrder(id));
});
