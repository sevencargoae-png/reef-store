import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { quoteCart } from "@/lib/services/orders";

const schema = z.object({ addressId: z.string().optional().nullable(), couponCode: z.string().trim().max(40).optional().nullable() });
export const POST = handler(async (req) => {
  const u = await requireUser();
  const b = await parseBody(req, schema);
  const addr = b.addressId ? await prisma.address.findFirst({ where: { id: b.addressId, userId: u.id } }) : null;
  return ok(await quoteCart(u, { areaId: addr?.areaId ?? null, couponCode: b.couponCode }));
});
