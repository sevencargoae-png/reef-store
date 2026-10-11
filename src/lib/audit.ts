import { prisma } from "@/lib/db";

export async function audit(p: { userId?: string | null; action: string; entity: string; entityId?: string | null; before?: unknown; after?: unknown; ip?: string | null }) {
  await prisma.auditLog.create({
    data: {
      userId: p.userId ?? null, action: p.action, entity: p.entity, entityId: p.entityId ?? null,
      before: p.before === undefined ? undefined : (JSON.parse(JSON.stringify(p.before)) ?? undefined),
      after: p.after === undefined ? undefined : (JSON.parse(JSON.stringify(p.after)) ?? undefined),
      ip: p.ip ?? null,
    },
  });
}
