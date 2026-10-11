import { randomBytes } from "node:crypto";
import { z } from "zod";
import { clientIp, fail, handler, ok, parseBody } from "@/lib/api";
import { normalizePhone, requireStaff } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { STAFF_ROLES } from "@/lib/rbac";

export const GET = handler(async () => {
  await requireStaff("users.write");
  const items = await prisma.user.findMany({ where: { role: { in: STAFF_ROLES } }, select: { id: true, name: true, phone: true, email: true, role: true, status: true, createdAt: true, mustChangePassword: true, _count: { select: { sessions: true } } }, orderBy: { createdAt: "asc" } });
  return ok({ items, meta: { page: 1, pages: 1, total: items.length } });
});

/** Creates a staff account with a random temporary password returned ONCE in the response (never stored in clear). */
export const POST = handler(async (req) => {
  const a = await requireStaff("users.write");
  const b = await parseBody(req, z.object({ name: z.string().min(2).max(80), phone: z.string().min(6), email: z.string().email().nullable().optional().or(z.literal("")), role: z.enum(["SUPER_ADMIN", "MANAGER", "OPERATIONS", "SUPPORT"]) }));
  const phone = normalizePhone(b.phone);
  if (!phone) return fail(422, "INVALID_PHONE");
  if (await prisma.user.findUnique({ where: { phone } })) return fail(409, "PHONE_TAKEN");
  const temp = randomBytes(9).toString("base64url");
  const u = await prisma.user.create({ data: { name: b.name, phone, email: b.email || null, role: b.role, passwordHash: await hashPassword(temp), mustChangePassword: true }, select: { id: true, name: true, phone: true, role: true } });
  await audit({ userId: a.id, action: "User.create", entity: "User", entityId: u.id, after: { name: b.name, phone, role: b.role }, ip: clientIp(req) });
  return ok({ ...u, tempPassword: temp }, { status: 201 });
});
