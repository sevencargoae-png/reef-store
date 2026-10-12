import { fail, handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/validation";

import { listAddresses } from "@/lib/services/addresses";

export const GET = handler(async () => ok(await listAddresses((await requireUser()).id)));
export const POST = handler(async (req) => {
  const u = await requireUser();
  const b = await parseBody(req, addressSchema);
  let areaId = b.areaId;
  if ((!areaId || areaId === "") && b.customArea) {
    // Auto-create a new area under the selected emirate
    const newArea = await prisma.area.create({ data: { emirateId: b.emirateId, nameAr: b.customArea, nameEn: b.customArea, deliveryFee: 15, active: true, sort: 999 } });
    areaId = newArea.id;
  } else {
    const area = await prisma.area.findFirst({ where: { id: areaId, emirateId: b.emirateId, active: true } });
    if (!area) return fail(400, "AREA_INACTIVE");
  }
  const count = await prisma.address.count({ where: { userId: u.id } });
  const isDefault = b.isDefault || count === 0;
  if (isDefault) await prisma.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
  const { customArea: _, ...data } = b;
  const a = await prisma.address.create({ data: { ...data, areaId, userId: u.id, isDefault } });
  return ok(a, { status: 201 });
});
