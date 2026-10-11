import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { ApiError } from "@/lib/api";
import { dec, qtyDec, qtyNum, toFils } from "@/lib/money";
import { quote, type PriceLine } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";
import type { AuthUser } from "@/lib/auth/session";
import { getCartDTO, clearCart, addManyToCart } from "./cart";
import { validateCoupon } from "./coupons";
import { slotOpen, uaeToday, uaeWeekday } from "./delivery";
import { productInclude, toDTO } from "./catalog";

type Tx = Prisma.TransactionClient;

export { TRANSITIONS, CUSTOMER_CANCELLABLE } from "@/lib/order-status";
import { TRANSITIONS, CUSTOMER_CANCELLABLE } from "@/lib/order-status";

export const orderInclude = { items: { orderBy: { id: "asc" as const } }, events: { orderBy: { createdAt: "asc" as const }, include: { byUser: { select: { name: true, role: true } } } }, slot: true, user: { select: { id: true, name: true, phone: true } } } satisfies Prisma.OrderInclude;
export type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export interface OrderDTO {
  id: string; number: string; status: OrderStatus; paymentMethod: string; paymentStatus: string; createdAt: string;
  customer: { id: string; name: string; phone: string };
  address: { emirateName: string; areaName: string; street: string; building: string; unit: string | null; notes: string | null };
  deliveryDate: string | null; slotLabel: string | null;
  subtotal: number; discount: number; deliveryFee: number; vatRate: number; vatAmount: number; total: number; finalTotal: number | null; couponCode: string | null; notes: string | null;
  items: { id: string; productId: string | null; nameAr: string; nameEn: string; unit: string; unitPrice: number; qty: number; actualQty: number | null; lineTotal: number; soldByActualWeight: boolean }[];
  events: { id: string; type: string; fromStatus: OrderStatus | null; toStatus: OrderStatus | null; note: string | null; by: string | null; createdAt: string }[];
}

export function orderToDTO(o: OrderRow): OrderDTO {
  return {
    id: o.id, number: o.number, status: o.status, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus, createdAt: o.createdAt.toISOString(),
    customer: { id: o.user.id, name: o.customerName, phone: o.customerPhone },
    address: { emirateName: o.emirateName, areaName: o.areaName, street: o.street, building: o.building, unit: o.unit, notes: o.addressNotes },
    deliveryDate: o.deliveryDate ? o.deliveryDate.toISOString().slice(0, 10) : null, slotLabel: o.slotLabel,
    subtotal: toFils(o.subtotal), discount: toFils(o.discount), deliveryFee: toFils(o.deliveryFee), vatRate: Number(o.vatRate), vatAmount: toFils(o.vatAmount), total: toFils(o.total), finalTotal: o.finalTotal ? toFils(o.finalTotal) : null,
    couponCode: o.couponCode, notes: o.notes,
    items: o.items.map((i) => ({ id: i.id, productId: i.productId, nameAr: i.nameAr, nameEn: i.nameEn, unit: i.unit, unitPrice: toFils(i.unitPrice), qty: qtyNum(i.qty), actualQty: i.actualQty ? qtyNum(i.actualQty) : null, lineTotal: toFils(i.lineTotal), soldByActualWeight: i.soldByActualWeight })),
    events: o.events.map((e) => ({ id: e.id, type: e.type, fromStatus: e.fromStatus, toStatus: e.toStatus, note: e.note, by: e.byUser?.name ?? null, createdAt: e.createdAt.toISOString() })),
  };
}

async function nextOrderNumber(tx: Tx) {
  const c = await tx.counter.upsert({ where: { name: "order" }, create: { name: "order", value: 1 }, update: { value: { increment: 1 } } });
  return `RF-${String(c.value).padStart(6, "0")}`;
}

/** Decrements stock atomically; throws OUT_OF_STOCK when the guard fails. Bundles consume their components. */
async function consumeStock(tx: Tx, product: { id: string; kind: string; trackStock: boolean; bundleItems: { componentId: string; qty: Prisma.Decimal }[] }, qty: number, refId: string, reason: string, byUserId: string | null) {
  const targets = product.kind === "BUNDLE" ? product.bundleItems.map((b) => ({ id: b.componentId, qty: qtyNum(b.qty) * qty })) : product.trackStock ? [{ id: product.id, qty }] : [];
  for (const t of targets) {
    const r = await tx.product.updateMany({ where: { id: t.id, OR: [{ trackStock: false }, { stockQty: { gte: qtyDec(t.qty) } }] }, data: { stockQty: { decrement: qtyDec(t.qty) } } });
    if (r.count === 0) throw new ApiError(409, "OUT_OF_STOCK", undefined, { productId: t.id });
    await tx.stockMovement.create({ data: { productId: t.id, delta: qtyDec(-t.qty), reason, refId, byUserId } });
  }
}

async function restoreStock(tx: Tx, orderId: string, byUserId: string | null) {
  const moves = await tx.stockMovement.findMany({ where: { refId: orderId, reason: { in: ["ORDER", "PREP_ADJUST"] } } });
  const byProduct = new Map<string, number>();
  for (const m of moves) byProduct.set(m.productId, (byProduct.get(m.productId) ?? 0) + qtyNum(m.delta));
  for (const [productId, delta] of byProduct) {
    if (delta >= 0) continue;
    await tx.product.update({ where: { id: productId }, data: { stockQty: { increment: qtyDec(-delta) } } });
    await tx.stockMovement.create({ data: { productId, delta: qtyDec(-delta), reason: "CANCEL", refId: orderId, byUserId } });
  }
}

export interface PlaceOrderInput { addressId: string; slotId: string; deliveryDate: string; couponCode?: string | null; notes?: string | null }

/** Builds the price preview for the current cart (used by checkout UI and placeOrder). */
export async function quoteCart(user: AuthUser, p: { areaId?: string | null; couponCode?: string | null }) {
  const [cart, settings] = await Promise.all([getCartDTO(user), getSettings()]);
  const area = p.areaId ? await prisma.area.findFirst({ where: { id: p.areaId, active: true } }) : null;
  const lines: PriceLine[] = cart.items.map((l) => ({ price: l.product.price, qty: l.qty, vatApplicable: l.product.vatApplicable }));
  const subtotal = lines.reduce((s, l) => s + Math.round(l.price * l.qty), 0);
  let coupon = null; let couponError: string | null = null;
  if (p.couponCode) { try { coupon = await validateCoupon(prisma, p.couponCode, user.id, subtotal); } catch (e) { couponError = e instanceof ApiError ? e.code : "COUPON_INVALID"; } }
  const q = quote(lines, { coupon: coupon?.rule, area: area ? { deliveryFee: toFils(area.deliveryFee), freeDeliveryThreshold: area.freeDeliveryThreshold ? toFils(area.freeDeliveryThreshold) : null } : null, vat: settings });
  const minOrder = Math.max(settings.minOrderAed * 100, area ? toFils(area.minOrder) : 0);
  return { cart, quote: q, coupon: coupon ? { code: coupon.code } : null, couponError, minOrder, minOrderMet: q.subtotal >= minOrder, settings: { vatEnabled: settings.vatEnabled, vatRate: settings.vatRate, pricesIncludeVat: settings.pricesIncludeVat, codEnabled: settings.codEnabled } };
}

export async function placeOrder(user: AuthUser, input: PlaceOrderInput, meta: { ip?: string | null } = {}) {
  const settings = await getSettings();
  if (!settings.codEnabled) throw new ApiError(400, "COD_DISABLED");
  const address = await prisma.address.findFirst({ where: { id: input.addressId, userId: user.id }, include: { area: { include: { emirate: true } } } });
  if (!address) throw new ApiError(404, "NOT_FOUND", "Address not found");
  if (!address.area.active || !address.area.emirate.active) throw new ApiError(400, "AREA_INACTIVE");

  const cart = await getCartDTO(user);
  if (!cart.items.length) throw new ApiError(400, "CART_EMPTY");

  const slot = await prisma.deliverySlot.findFirst({ where: { id: input.slotId, active: true } });
  const today = uaeToday();
  if (!slot || !/^\d{4}-\d{2}-\d{2}$/.test(input.deliveryDate) || uaeWeekday(input.deliveryDate) !== slot.weekday || input.deliveryDate < today) throw new ApiError(400, "SLOT_CLOSED");
  if (!slotOpen(input.deliveryDate, slot)) throw new ApiError(400, "SLOT_CLOSED");
  const deliveryDate = new Date(`${input.deliveryDate}T00:00:00Z`);

  const lines: PriceLine[] = cart.items.map((l) => ({ price: l.product.price, qty: l.qty, vatApplicable: l.product.vatApplicable }));
  const subtotal = lines.reduce((s, l) => s + Math.round(l.price * l.qty), 0);
  const minOrder = Math.max(settings.minOrderAed * 100, toFils(address.area.minOrder));
  if (subtotal < minOrder) throw new ApiError(400, "MIN_ORDER", undefined, { minOrder });

  const order = await prisma.$transaction(async (tx) => {
    // slot capacity re-checked inside the transaction (serializable enough for this volume: count + insert)
    const booked = await tx.order.count({ where: { slotId: slot.id, deliveryDate, status: { not: "CANCELLED" } } });
    if (booked >= slot.capacity) throw new ApiError(409, "SLOT_FULL");

    const coupon = input.couponCode ? await validateCoupon(tx, input.couponCode, user.id, subtotal) : null;
    const q = quote(lines, { coupon: coupon?.rule, area: { deliveryFee: toFils(address.area.deliveryFee), freeDeliveryThreshold: address.area.freeDeliveryThreshold ? toFils(address.area.freeDeliveryThreshold) : null }, vat: settings });

    const number = await nextOrderNumber(tx);
    const created = await tx.order.create({
      data: {
        number, userId: user.id, status: "PENDING", paymentMethod: "COD", paymentStatus: "UNPAID",
        customerName: user.name, customerPhone: user.phone, emirateName: address.area.emirate.nameAr, areaId: address.areaId, areaName: address.area.nameAr,
        street: address.street, building: address.building, unit: address.unit, addressNotes: address.notes,
        slotId: slot.id, deliveryDate, slotLabel: `${slot.startTime}–${slot.endTime}`,
        subtotal: dec(q.subtotal), discount: dec(q.discount), deliveryFee: dec(q.deliveryFee), vatRate: q.vatRate, vatAmount: dec(q.vatAmount), total: dec(q.total),
        couponCode: coupon?.code ?? null, notes: input.notes?.trim() || null,
        items: { create: cart.items.map((l, i) => ({ productId: l.product.id, nameAr: l.product.nameAr, nameEn: l.product.nameEn, unit: l.product.unit, unitPrice: dec(l.product.price), qty: qtyDec(l.qty), lineTotal: dec(q.lines[i]), soldByActualWeight: l.product.soldByActualWeight, vatApplicable: l.product.vatApplicable })) },
        events: { create: { type: "CREATED", toStatus: "PENDING", byUserId: user.id } },
      },
    });
    // cost snapshot (never exposed to the customer) for profit reports
    for (const l of cart.items) {
      const p = await tx.product.findUniqueOrThrow({ where: { id: l.product.id }, include: { bundleItems: true } });
      await tx.orderItem.updateMany({ where: { orderId: created.id, productId: p.id }, data: { costPrice: p.costPrice } });
      await consumeStock(tx, p, l.qty, created.id, "ORDER", user.id);
    }
    if (coupon) {
      await tx.couponUse.create({ data: { couponId: coupon.id, userId: user.id, orderId: created.id } });
      await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }
    return created;
  });
  await clearCart(user);
  await audit({ userId: user.id, action: "order.create", entity: "Order", entityId: order.id, after: { number: order.number, total: String(order.total) }, ip: meta.ip });
  return getOrder(order.id);
}

export async function getOrder(id: string) {
  const o = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  return o ? orderToDTO(o) : null;
}

export async function listMyOrders(userId: string, page = 1, pageSize = 20) {
  const where = { userId };
  const [rows, total] = await Promise.all([prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.order.count({ where })]);
  return { items: rows.map(orderToDTO), meta: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } };
}

export async function cancelOrder(orderId: string, actor: AuthUser, reason: string | null, asStaff: boolean) {
  await prisma.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: orderId } });
    if (!o || (!asStaff && o.userId !== actor.id)) throw new ApiError(404, "NOT_FOUND");
    const allowed = asStaff ? TRANSITIONS[o.status].includes("CANCELLED") : CUSTOMER_CANCELLABLE.includes(o.status);
    if (!allowed) throw new ApiError(409, "INVALID_TRANSITION");
    await tx.order.update({ where: { id: o.id }, data: { status: "CANCELLED" } });
    await tx.orderEvent.create({ data: { orderId: o.id, type: "STATUS", fromStatus: o.status, toStatus: "CANCELLED", note: reason, byUserId: actor.id } });
    await restoreStock(tx, o.id, actor.id);
    if (o.couponCode) {
      const use = await tx.couponUse.findFirst({ where: { orderId: o.id } });
      if (use) { await tx.couponUse.delete({ where: { id: use.id } }); await tx.coupon.update({ where: { id: use.couponId }, data: { usedCount: { decrement: 1 } } }); }
    }
  });
  await audit({ userId: actor.id, action: "order.cancel", entity: "Order", entityId: orderId, after: { reason } });
  return getOrder(orderId);
}

export async function transitionOrder(orderId: string, to: OrderStatus, actor: AuthUser, note: string | null) {
  if (to === "CANCELLED") return cancelOrder(orderId, actor, note, true);
  await prisma.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: orderId } });
    if (!o) throw new ApiError(404, "NOT_FOUND");
    if (!TRANSITIONS[o.status].includes(to)) throw new ApiError(409, "INVALID_TRANSITION");
    await tx.order.update({ where: { id: o.id }, data: { status: to, ...(to === "DELIVERED" && o.paymentMethod === "COD" ? { paymentStatus: "PAID" } : {}) } });
    await tx.orderEvent.create({ data: { orderId: o.id, type: "STATUS", fromStatus: o.status, toStatus: to, note, byUserId: actor.id } });
  });
  await audit({ userId: actor.id, action: `order.status.${to}`, entity: "Order", entityId: orderId, after: { note } });
  return getOrder(orderId);
}

/** Preparation step: record measured weights; re-prices weighed lines and the order total. */
export async function setActualQuantities(orderId: string, actor: AuthUser, items: { itemId: string; actualQty: number }[]) {
  const settings = await getSettings();
  await prisma.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: orderId }, include: { items: true, area: true } });
    if (!o) throw new ApiError(404, "NOT_FOUND");
    if (!["CONFIRMED", "PREPARING"].includes(o.status)) throw new ApiError(409, "INVALID_TRANSITION");
    const byId = new Map(o.items.map((i) => [i.id, i]));
    for (const it of items) {
      const row = byId.get(it.itemId);
      if (!row) throw new ApiError(404, "NOT_FOUND", "Item not found");
      const actual = qtyNum(it.actualQty);
      await tx.orderItem.update({ where: { id: row.id }, data: { actualQty: qtyDec(actual), lineTotal: dec(Math.round(toFils(row.unitPrice) * actual)) } });
      if (row.productId) {
        const prev = row.actualQty ? qtyNum(row.actualQty) : qtyNum(row.qty);
        const diff = prev - actual; // positive → give stock back
        if (diff !== 0) {
          const p = await tx.product.findUnique({ where: { id: row.productId } });
          if (p?.trackStock) {
            await tx.product.update({ where: { id: p.id }, data: { stockQty: { increment: qtyDec(diff) } } });
            await tx.stockMovement.create({ data: { productId: p.id, delta: qtyDec(diff), reason: "PREP_ADJUST", refId: o.id, byUserId: actor.id } });
          }
        }
      }
    }
    const fresh = await tx.orderItem.findMany({ where: { orderId: o.id } });
    const lines: PriceLine[] = fresh.map((i) => ({ price: toFils(i.unitPrice), qty: i.actualQty ? qtyNum(i.actualQty) : qtyNum(i.qty), vatApplicable: i.vatApplicable }));
    const coupon = o.couponCode ? await tx.coupon.findUnique({ where: { code: o.couponCode } }) : null;
    const q = quote(lines, {
      coupon: coupon ? { type: coupon.type, value: coupon.type === "PERCENT" ? Number(coupon.value) : toFils(coupon.value), maxDiscount: coupon.maxDiscount ? toFils(coupon.maxDiscount) : null } : null,
      area: { deliveryFee: toFils(o.deliveryFee), freeDeliveryThreshold: null }, // keep the fee agreed at checkout
      vat: { vatEnabled: Number(o.vatRate) > 0, vatRate: Number(o.vatRate), pricesIncludeVat: settings.pricesIncludeVat },
    });
    await tx.order.update({ where: { id: o.id }, data: { finalTotal: dec(q.total), discount: dec(q.discount), vatAmount: dec(q.vatAmount) } });
    await tx.orderEvent.create({ data: { orderId: o.id, type: "WEIGHT_ADJUST", note: `final=${(q.total / 100).toFixed(2)}`, byUserId: actor.id } });
  });
  await audit({ userId: actor.id, action: "order.weights", entity: "Order", entityId: orderId, after: { items } });
  return getOrder(orderId);
}

export async function reorder(user: AuthUser, orderId: string) {
  const o = await prisma.order.findFirst({ where: { id: orderId, userId: user.id }, include: { items: true } });
  if (!o) throw new ApiError(404, "NOT_FOUND");
  const items = o.items.filter((i) => i.productId).map((i) => ({ productId: i.productId!, qty: qtyNum(i.qty) }));
  const { skipped } = await addManyToCart(user, items);
  return { added: items.length - skipped.length, skipped };
}

/** Used by the admin product views to show the live DTO after stock edits. */
export async function productDTO(id: string) {
  const p = await prisma.product.findUnique({ where: { id }, include: productInclude });
  return p ? toDTO(p) : null;
}
