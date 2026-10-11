import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { qtyDec, qtyNum } from "@/lib/money";
import type { SubscriptionFrequency, SubscriptionStatus } from "@/generated/prisma/enums";
import { productInclude, toDTO, type ProductDTO } from "./catalog";
import { addDays, uaeToday, uaeWeekday } from "./delivery";

export interface SubscriptionDTO {
  id: string; name: string; frequency: SubscriptionFrequency; weekday: number; status: SubscriptionStatus; nextRunAt: string; lastRunAt: string | null;
  slot: { id: string; label: string } | null; address: { id: string; label: string; areaNameAr: string; areaNameEn: string };
  items: { product: ProductDTO; qty: number }[];
}
const include = { items: { include: { product: { include: productInclude } } }, slot: true, address: { include: { area: true } } };

function dto(s: { id: string; name: string; frequency: SubscriptionFrequency; weekday: number; status: SubscriptionStatus; nextRunAt: Date; lastRunAt: Date | null; slot: { id: string; startTime: string; endTime: string } | null; address: { id: string; label: string; area: { nameAr: string; nameEn: string } }; items: { qty: unknown; product: Parameters<typeof toDTO>[0] }[] }): SubscriptionDTO {
  return { id: s.id, name: s.name, frequency: s.frequency, weekday: s.weekday, status: s.status, nextRunAt: s.nextRunAt.toISOString().slice(0, 10), lastRunAt: s.lastRunAt?.toISOString() ?? null,
    slot: s.slot ? { id: s.slot.id, label: `${s.slot.startTime}–${s.slot.endTime}` } : null, address: { id: s.address.id, label: s.address.label, areaNameAr: s.address.area.nameAr, areaNameEn: s.address.area.nameEn },
    items: s.items.map((i) => ({ product: toDTO(i.product), qty: qtyNum(i.qty as number) })) };
}

/** First date strictly after `from` that falls on `weekday`. */
export function nextDateFor(weekday: number, from = uaeToday()) {
  let d = addDays(from, 1);
  while (uaeWeekday(d) !== weekday) d = addDays(d, 1);
  return d;
}

export async function mySubscriptions(userId: string) {
  const rows = await prisma.subscription.findMany({ where: { userId }, include, orderBy: { createdAt: "desc" } });
  return rows.map(dto);
}

export async function createSubscription(userId: string, p: { name: string; frequency: SubscriptionFrequency; weekday: number; slotId: string | null; addressId: string; items: { productId: string; qty: number }[] }) {
  const addr = await prisma.address.findFirst({ where: { id: p.addressId, userId } });
  if (!addr) throw new ApiError(404, "NOT_FOUND", "Address not found");
  if (p.slotId) { const s = await prisma.deliverySlot.findFirst({ where: { id: p.slotId, active: true, weekday: p.weekday } }); if (!s) throw new ApiError(400, "SLOT_CLOSED"); }
  const valid = new Set((await prisma.product.findMany({ where: { id: { in: p.items.map((i) => i.productId) }, isActive: true }, select: { id: true } })).map((v) => v.id));
  const items = p.items.filter((i) => valid.has(i.productId));
  if (!items.length) throw new ApiError(400, "CART_EMPTY");
  const s = await prisma.subscription.create({ data: { userId, name: p.name, frequency: p.frequency, weekday: p.weekday, slotId: p.slotId, addressId: p.addressId, nextRunAt: new Date(`${nextDateFor(p.weekday)}T00:00:00Z`), items: { create: items.map((i) => ({ productId: i.productId, qty: qtyDec(i.qty) })) } }, include });
  return dto(s);
}

export async function setSubscriptionStatus(userId: string | null, id: string, status: SubscriptionStatus) {
  const s = await prisma.subscription.findFirst({ where: { id, ...(userId ? { userId } : {}) } });
  if (!s) throw new ApiError(404, "NOT_FOUND");
  if (s.status === "CANCELLED") throw new ApiError(409, "INVALID_TRANSITION");
  const data: { status: SubscriptionStatus; nextRunAt?: Date } = { status };
  if (status === "ACTIVE" && s.nextRunAt < new Date(`${uaeToday()}T00:00:00Z`)) data.nextRunAt = new Date(`${nextDateFor(s.weekday)}T00:00:00Z`);
  const r = await prisma.subscription.update({ where: { id }, data, include });
  return dto(r);
}

/**
 * Job: creates a cart-free order for every ACTIVE subscription whose nextRunAt is due.
 * Items that are out of stock are skipped (noted on the order); an empty result pauses nothing — next run is still scheduled.
 */
export async function runDueSubscriptions(now = new Date()) {
  const { placeOrderFromItems } = await import("./subscription-orders");
  const today = uaeToday(now);
  const due = await prisma.subscription.findMany({ where: { status: "ACTIVE", nextRunAt: { lte: new Date(`${today}T00:00:00Z`) } }, include: { items: true, user: true } });
  const results: { subscriptionId: string; orderId?: string; error?: string }[] = [];
  for (const s of due) {
    const stepDays = s.frequency === "WEEKLY" ? 7 : 14;
    const deliveryDate = s.nextRunAt.toISOString().slice(0, 10) >= today ? s.nextRunAt.toISOString().slice(0, 10) : nextDateFor(s.weekday, today);
    try {
      const order = await placeOrderFromItems(s.user, { addressId: s.addressId, slotId: s.slotId, deliveryDate, items: s.items.map((i) => ({ productId: i.productId, qty: qtyNum(i.qty) })), subscriptionId: s.id });
      results.push({ subscriptionId: s.id, orderId: order?.id });
    } catch (e) {
      results.push({ subscriptionId: s.id, error: e instanceof ApiError ? e.code : "INTERNAL" });
    }
    await prisma.subscription.update({ where: { id: s.id }, data: { lastRunAt: now, nextRunAt: new Date(`${addDays(deliveryDate, stepDays)}T00:00:00Z`) } });
  }
  return results;
}
