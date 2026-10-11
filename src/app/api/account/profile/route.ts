import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const schema = z.object({ name: z.string().trim().min(2).max(80).optional(), email: z.string().trim().email().nullable().optional().or(z.literal("")), householdSize: z.number().int().min(1).max(30).nullable().optional(), locale: z.enum(["ar", "en"]).optional() });
export const PATCH = handler(async (req) => {
  const u = await requireUser();
  const b = await parseBody(req, schema);
  const user = await prisma.user.update({ where: { id: u.id }, data: { ...b, email: b.email === "" ? null : b.email }, select: { id: true, name: true, phone: true, email: true, householdSize: true, locale: true } });
  return ok(user);
});
