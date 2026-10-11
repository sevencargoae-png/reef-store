import { handler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { getList } from "@/lib/services/lists";
import { addManyToCart, getCartDTO } from "@/lib/services/cart";
export const POST = handler<{ params: Promise<{ id: string }> }>(async (_r, { params }) => {
  const u = await requireUser();
  const l = await getList(u.id, (await params).id);
  const { skipped } = await addManyToCart(u, l.items.map((i) => ({ productId: i.product.id, qty: i.qty })));
  return ok({ ...(await getCartDTO(u)), skipped });
});
