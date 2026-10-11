import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { setSubscriptionStatus } from "@/lib/services/subscriptions";
export const PATCH = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const u = await requireUser();
  const b = await parseBody(req, z.object({ status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]) }));
  return ok(await setSubscriptionStatus(u.id, (await params).id, b.status));
});
