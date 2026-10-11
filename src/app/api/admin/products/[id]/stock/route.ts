import { z } from "zod";
import { clientIp, handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { adjustStock } from "@/lib/admin/products";
export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const u = await requireStaff("catalog.write");
  const { id } = await params;
  const b = await parseBody(req, z.object({ delta: z.number().refine((n) => n !== 0), reason: z.enum(["RECEIVE", "ADJUST", "WASTE"]), note: z.string().max(200).nullable().optional() }));
  const p = await adjustStock(id, b.delta, b.reason, b.note ?? null, u.id);
  await audit({ userId: u.id, action: "Product.stock", entity: "Product", entityId: id, after: b, ip: clientIp(req) });
  return ok(p);
});
