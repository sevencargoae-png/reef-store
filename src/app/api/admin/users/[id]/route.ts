import { z } from "zod";
import { ApiError, clientIp, handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
export const PATCH = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const a = await requireStaff("users.write");
  const { id } = await params;
  const b = await parseBody(req, z.object({ name: z.string().min(2).max(80).optional(), role: z.enum(["SUPER_ADMIN", "MANAGER", "OPERATIONS", "SUPPORT"]).optional(), status: z.enum(["ACTIVE", "SUSPENDED"]).optional() }));
  if (id === a.id && (b.status === "SUSPENDED" || (b.role && b.role !== "SUPER_ADMIN"))) throw new ApiError(400, "VALIDATION", "Cannot demote or suspend yourself");
  const before = await prisma.user.findUnique({ where: { id } });
  if (!before || before.role === "CUSTOMER") throw new ApiError(404, "NOT_FOUND");
  const u = await prisma.user.update({ where: { id }, data: b, select: { id: true, name: true, role: true, status: true } });
  if (b.status === "SUSPENDED") await prisma.session.deleteMany({ where: { userId: id } });
  await audit({ userId: a.id, action: "User.update", entity: "User", entityId: id, before: { name: before.name, role: before.role, status: before.status }, after: b, ip: clientIp(req) });
  return ok(u);
});
