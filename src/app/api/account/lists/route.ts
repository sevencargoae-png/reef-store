import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { createList, myLists } from "@/lib/services/lists";

const schema = z.object({ name: z.string().trim().min(1).max(60), isWeekly: z.boolean().optional(), items: z.array(z.object({ productId: z.string(), qty: z.number().positive().max(999) })).max(100).default([]) });
export const GET = handler(async () => ok(await myLists((await requireUser()).id)));
export const POST = handler(async (req) => { const u = await requireUser(); const b = await parseBody(req, schema); return ok(await createList(u.id, b.name, b.items, b.isWeekly), { status: 201 }); });
