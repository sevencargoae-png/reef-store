import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { currentUser } from "@/lib/auth/session";
import { getCartDTO, setCartItem } from "@/lib/services/cart";

const schema = z.object({ productId: z.string().min(1), qty: z.number().min(0).max(999) });

/** PUT sets the absolute quantity (0 removes). */
export const PUT = handler(async (req) => {
  const body = await parseBody(req, schema);
  const u = await currentUser();
  await setCartItem(u, body.productId, body.qty);
  return ok(await getCartDTO(u));
});
