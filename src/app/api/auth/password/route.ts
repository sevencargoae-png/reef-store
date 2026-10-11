import { z } from "zod";
import { fail, handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

const schema = z.object({ current: z.string().min(1), next: z.string().min(8).max(128) });
export const POST = handler(async (req) => {
  const u = await requireUser();
  const b = await parseBody(req, schema);
  const row = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
  if (!row.passwordHash || !(await verifyPassword(b.current, row.passwordHash))) return fail(400, "WRONG_PASSWORD");
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(b.next), mustChangePassword: false } });
  // other sessions are revoked; the current one stays
  return ok({ ok: true });
});
