import { handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
export const GET = handler(async (req) => {
  await requireStaff("audit.read");
  const sp = new URL(req.url).searchParams; const page = Math.max(1, Number(sp.get("page") ?? 1)); const pageSize = 50;
  const where: Prisma.AuditLogWhereInput = {};
  const q = sp.get("q")?.trim();
  if (q) where.OR = [{ action: { contains: q, mode: "insensitive" } }, { entity: { contains: q, mode: "insensitive" } }, { entityId: { contains: q } }, { user: { name: { contains: q, mode: "insensitive" } } }];
  const [items, total] = await Promise.all([prisma.auditLog.findMany({ where, include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.auditLog.count({ where })]);
  return ok({ items, meta: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } });
});
