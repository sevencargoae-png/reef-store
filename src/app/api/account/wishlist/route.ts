import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const list = (userId: string) => prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true }, orderBy: { createdAt: "desc" } });

export const GET = handler(async () => ok(await list((await requireUser()).id)));
/** Toggles the product in the wishlist. */
export const POST = handler(async (req) => {
  const u = await requireUser();
  const { productId } = await parseBody(req, z.object({ productId: z.string().min(1) }));
  const existing = await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId: u.id, productId } } });
  if (existing) await prisma.wishlistItem.delete({ where: { id: existing.id } });
  else if (await prisma.product.findFirst({ where: { id: productId, isActive: true } })) await prisma.wishlistItem.create({ data: { userId: u.id, productId } });
  return ok(await list(u.id));
});
