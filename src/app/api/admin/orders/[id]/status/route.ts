import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { transitionOrder } from "@/lib/services/orders";
export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const u = await requireStaff("orders.write");
  const b = await parseBody(req, z.object({ status: z.enum(["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]), note: z.string().max(300).nullable().optional() }));
  return ok(await transitionOrder((await params).id, b.status, u, b.note ?? null));
});
