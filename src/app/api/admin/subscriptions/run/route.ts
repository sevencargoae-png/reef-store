import { handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { runDueSubscriptions } from "@/lib/services/subscriptions";
export const POST = handler(async () => {
  const u = await requireStaff("orders.write");
  const results = await runDueSubscriptions();
  await audit({ userId: u.id, action: "Subscription.run", entity: "Subscription", after: results });
  return ok(results);
});
