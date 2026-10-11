import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { setSubscriptionStatus } from "@/lib/services/subscriptions";
export const PATCH = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const u = await requireStaff("orders.write");
  const { id } = await params;
  const b = await parseBody(req, z.object({ status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]) }));
  const r = await setSubscriptionStatus(null, id, b.status);
  await audit({ userId: u.id, action: `Subscription.${b.status}`, entity: "Subscription", entityId: id });
  return ok(r);
});
