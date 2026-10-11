import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { setListItem } from "@/lib/services/lists";
export const PUT = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const u = await requireUser();
  const b = await parseBody(req, z.object({ productId: z.string(), qty: z.number().min(0).max(999) }));
  return ok(await setListItem(u.id, (await params).id, b.productId, b.qty));
});
