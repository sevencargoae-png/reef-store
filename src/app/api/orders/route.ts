import { clientIp, fail, handler, ok, parseBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { listMyOrders, placeOrder } from "@/lib/services/orders";
import { placeOrderSchema } from "@/lib/validation";

export const GET = handler(async (req) => {
  const u = await requireUser();
  const page = Number(new URL(req.url).searchParams.get("page") ?? 1);
  return ok(await listMyOrders(u.id, page));
});
export const POST = handler(async (req) => {
  const u = await requireUser();
  if (!rateLimit(`order:${u.id}`, 10, 60 * 60_000)) return fail(429, "RATE_LIMIT");
  const b = await parseBody(req, placeOrderSchema);
  return ok(await placeOrder(u, b, { ip: clientIp(req) }), { status: 201 });
});
