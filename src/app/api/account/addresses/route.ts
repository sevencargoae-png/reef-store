import { fail, handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/validation";

import { listAddresses } from "@/lib/services/addresses";

export const GET = handler(async () => ok(await listAddresses((await requireUser()).id)));
export const POST = handler(async (req) => {
  const u = await requireUser();
  const b = await parseBody(req, addressSchema);
  const area = await prisma.area.findFirst({ where: { id: b.areaId, emirateId: b.emirateId, active: true } });
  if (!area) return fail(400, "AREA_INACTIVE");
  const count = await prisma.address.count({ where: { userId: u.id } });
  const isDefault = b.isDefault || count === 0;
  if (isDefault) await prisma.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
  const a = await prisma.address.create({ data: { ...b, userId: u.id, isDefault } });
  return ok(a, { status: 201 });
});
