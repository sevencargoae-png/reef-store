import { z } from "zod";
import { clientIp, handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { getSettings, saveSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";
const schema = z.object({
  storeNameAr: z.string().min(1).max(60), storeNameEn: z.string().min(1).max(60),
  vatEnabled: z.boolean(), vatRate: z.number().min(0).max(0.5), pricesIncludeVat: z.boolean(),
  codEnabled: z.boolean(), minOrderAed: z.number().min(0).max(10000), bookingWindowDays: z.number().int().min(1).max(30),
  deliveryPromiseAr: z.string().max(120), deliveryPromiseEn: z.string().max(120), supportPhone: z.string().max(30), supportWhatsapp: z.string().max(30),
}).partial();
export const GET = handler(async () => { await requireStaff("settings.write"); return ok(await getSettings()); });
export const PATCH = handler(async (req) => {
  const u = await requireStaff("settings.write");
  const before = await getSettings();
  const b = await parseBody(req, schema);
  const after = await saveSettings(b);
  await audit({ userId: u.id, action: "Settings.update", entity: "Setting", entityId: "store", before, after, ip: clientIp(req) });
  return ok(after);
});
