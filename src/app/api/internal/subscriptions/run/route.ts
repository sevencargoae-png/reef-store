import { timingSafeEqual } from "node:crypto";
import { fail, handler, ok } from "@/lib/api";
import { runDueSubscriptions } from "@/lib/services/subscriptions";

/** Cron entry point: POST with `Authorization: Bearer $CRON_SECRET`. Returns 404 when the secret is not configured. */
export const POST = handler(async (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail(404, "NOT_FOUND");
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) return fail(401, "UNAUTHENTICATED");
  return ok(await runDueSubscriptions());
});
