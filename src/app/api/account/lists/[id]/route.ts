import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { deleteList, getList, updateList } from "@/lib/services/lists";
type Ctx = { params: Promise<{ id: string }> };
export const GET = handler<Ctx>(async (_r, { params }) => ok(await getList((await requireUser()).id, (await params).id)));
export const PATCH = handler<Ctx>(async (req, { params }) => { const u = await requireUser(); const b = await parseBody(req, z.object({ name: z.string().trim().min(1).max(60).optional(), isWeekly: z.boolean().optional() })); return ok(await updateList(u.id, (await params).id, b)); });
export const DELETE = handler<Ctx>(async (_r, { params }) => { await deleteList((await requireUser()).id, (await params).id); return ok({ ok: true }); });
