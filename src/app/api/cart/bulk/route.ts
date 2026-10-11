import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { currentUser } from "@/lib/auth/session";
import { addManyToCart, getCartDTO } from "@/lib/services/cart";

const schema = z.object({ items: z.array(z.object({ productId: z.string().min(1), qty: z.number().positive().max(999) })).min(1).max(100) });

/** POST adds quantities on top of what is in the cart. */
export const POST = handler(async (req) => {
  const body = await parseBody(req, schema);
  const u = await currentUser();
  const { skipped } = await addManyToCart(u, body.items);
  const cart = await getCartDTO(u);
  return ok({ ...cart, skipped });
});
