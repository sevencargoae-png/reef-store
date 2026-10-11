import { fail, handler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { getOrder } from "@/lib/services/orders";
export const GET = handler<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const u = await requireUser();
  const o = await getOrder((await params).id);
  if (!o || o.customer.id !== u.id) return fail(404, "NOT_FOUND");
  return ok(o);
});
