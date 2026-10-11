import { handler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { reorder } from "@/lib/services/orders";
export const POST = handler<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const u = await requireUser();
  return ok(await reorder(u, (await params).id));
});
