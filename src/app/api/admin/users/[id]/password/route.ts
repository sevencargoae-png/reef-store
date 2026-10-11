import { randomBytes } from "node:crypto";
import { ApiError, clientIp, handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
/** Resets a staff password to a new temporary one (shown once) and signs the user out everywhere. */
export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const a = await requireStaff("users.write");
  const { id } = await params;
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u || u.role === "CUSTOMER") throw new ApiError(404, "NOT_FOUND");
  const temp = randomBytes(9).toString("base64url");
  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(temp), mustChangePassword: true } });
  await prisma.session.deleteMany({ where: { userId: id } });
  await audit({ userId: a.id, action: "User.password_reset", entity: "User", entityId: id, ip: clientIp(req) });
  return ok({ tempPassword: temp });
});
