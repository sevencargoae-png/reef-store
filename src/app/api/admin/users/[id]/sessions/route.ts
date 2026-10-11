import { handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
export const DELETE = handler<{ params: Promise<{ id: string }> }>(async (_r, { params }) => {
  const a = await requireStaff("users.write");
  const { id } = await params;
  const r = await prisma.session.deleteMany({ where: { userId: id } });
  await audit({ userId: a.id, action: "User.revoke_sessions", entity: "User", entityId: id, after: { count: r.count } });
  return ok({ count: r.count });
});
