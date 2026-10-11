import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { setActualQuantities } from "@/lib/services/orders";
export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const u = await requireStaff("orders.write");
  const b = await parseBody(req, z.object({ items: z.array(z.object({ itemId: z.string(), actualQty: z.number().min(0).max(10000) })).min(1) }));
  return ok(await setActualQuantities((await params).id, u, b.items));
});
