import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { createSubscription, mySubscriptions } from "@/lib/services/subscriptions";
const schema = z.object({ name: z.string().trim().min(1).max(60), frequency: z.enum(["WEEKLY", "BIWEEKLY"]), weekday: z.number().int().min(0).max(6), slotId: z.string().nullable().optional(), addressId: z.string(), items: z.array(z.object({ productId: z.string(), qty: z.number().positive().max(999) })).min(1).max(100) });
export const GET = handler(async () => ok(await mySubscriptions((await requireUser()).id)));
export const POST = handler(async (req) => { const u = await requireUser(); const b = await parseBody(req, schema); return ok(await createSubscription(u.id, { ...b, slotId: b.slotId ?? null }), { status: 201 }); });
