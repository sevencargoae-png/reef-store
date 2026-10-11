import { fail, handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = handler<Ctx>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  const b = await parseBody(req, addressSchema.partial());
  const existing = await prisma.address.findFirst({ where: { id, userId: u.id } });
  if (!existing) return fail(404, "NOT_FOUND");
  if (b.areaId) {
    const area = await prisma.area.findFirst({ where: { id: b.areaId, active: true } });
    if (!area) return fail(400, "AREA_INACTIVE");
    b.emirateId = area.emirateId;
  }
  if (b.isDefault) await prisma.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
  return ok(await prisma.address.update({ where: { id }, data: b }));
});
export const DELETE = handler<Ctx>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  const r = await prisma.address.deleteMany({ where: { id, userId: u.id, subscriptions: { none: {} } } });
  if (!r.count) return fail(404, "NOT_FOUND");
  return ok({ ok: true });
});
