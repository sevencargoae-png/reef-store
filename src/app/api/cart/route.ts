import { handler, ok } from "@/lib/api";
import { currentUser } from "@/lib/auth/session";
import { clearCart, getCartDTO } from "@/lib/services/cart";

export const GET = handler(async () => ok(await getCartDTO(await currentUser())));
export const DELETE = handler(async () => { const u = await currentUser(); await clearCart(u); return ok(await getCartDTO(u)); });
