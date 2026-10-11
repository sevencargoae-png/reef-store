import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { dec, qtyDec, qtyNum, toFils } from "@/lib/money";
import { quote, type PriceLine } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { productInclude, toDTO } from "./catalog";
import { clampQty } from "./cart";
import { slotOpen } from "./delivery";
import { getOrder } from "./orders";

/** Places an order directly from an item list (subscriptions). Unavailable items are dropped and noted. */
export async function placeOrderFromItems(user: { id: string; name: string; phone: string }, p: { addressId: string; slotId: string | null; deliveryDate: string; items: { productId: string; qty: number }[]; subscriptionId: string }) {
  const settings = await getSettings();
  const address = await prisma.address.findFirst({ where: { id: p.addressId, userId: user.id }, include: { area: { include: { emirate: true } } } });
  if (!address || !address.area.active) throw new ApiError(400, "AREA_INACTIVE");
  const rows = await prisma.product.findMany({ where: { id: { in: p.items.map((i) => i.productId) }, isActive: true }, include: productInclude });
  const skipped: string[] = [];
  const lines = p.items.flatMap((i) => {
    const r = rows.find((x) => x.id === i.productId);
    if (!r) { skipped.push(i.productId); return []; }
    const d = toDTO(r);
    if (!d.inStock) { skipped.push(d.nameAr); return []; }
    return [{ product: d, row: r, qty: clampQty(d, i.qty) }];
  });
  if (!lines.length) throw new ApiError(400, "CART_EMPTY");
  const slot = p.slotId ? await prisma.deliverySlot.findFirst({ where: { id: p.slotId, active: true } }) : null;
  const deliveryDate = new Date(`${p.deliveryDate}T00:00:00Z`);
  const priceLines: PriceLine[] = lines.map((l) => ({ price: l.product.price, qty: l.qty, vatApplicable: l.product.vatApplicable }));
  const q = quote(priceLines, { area: { deliveryFee: toFils(address.area.deliveryFee), freeDeliveryThreshold: address.area.freeDeliveryThreshold ? toFils(address.area.freeDeliveryThreshold) : null }, vat: settings });
  const order = await prisma.$transaction(async (tx) => {
    if (slot) {
      if (!slotOpen(p.deliveryDate, slot)) throw new ApiError(400, "SLOT_CLOSED");
      const booked = await tx.order.count({ where: { slotId: slot.id, deliveryDate, status: { not: "CANCELLED" } } });
      if (booked >= slot.capacity) throw new ApiError(409, "SLOT_FULL");
    }
    const c = await tx.counter.upsert({ where: { name: "order" }, create: { name: "order", value: 1 }, update: { value: { increment: 1 } } });
    const created = await tx.order.create({ data: {
      number: `RF-${String(c.value).padStart(6, "0")}`, userId: user.id, customerName: user.name, customerPhone: user.phone,
      emirateName: address.area.emirate.nameAr, areaId: address.areaId, areaName: address.area.nameAr, street: address.street, building: address.building, unit: address.unit, addressNotes: address.notes,
      slotId: slot?.id ?? null, deliveryDate, slotLabel: slot ? `${slot.startTime}–${slot.endTime}` : null, subscriptionId: p.subscriptionId,
      subtotal: dec(q.subtotal), discount: dec(0), deliveryFee: dec(q.deliveryFee), vatRate: q.vatRate, vatAmount: dec(q.vatAmount), total: dec(q.total),
      notes: skipped.length ? `[subscription] skipped unavailable: ${skipped.join(", ")}` : "[subscription]",
      items: { create: lines.map((l, i) => ({ productId: l.product.id, nameAr: l.product.nameAr, nameEn: l.product.nameEn, unit: l.product.unit, unitPrice: dec(l.product.price), costPrice: l.row.costPrice, qty: qtyDec(l.qty), lineTotal: dec(q.lines[i]), soldByActualWeight: l.product.soldByActualWeight, vatApplicable: l.product.vatApplicable })) },
      events: { create: { type: "CREATED", toStatus: "PENDING", note: "subscription" } },
    } });
    for (const l of lines) {
      const targets = l.row.kind === "BUNDLE" ? l.row.bundleItems.map((b) => ({ id: b.componentId, qty: qtyNum(b.qty) * l.qty })) : l.row.trackStock ? [{ id: l.row.id, qty: l.qty }] : [];
      for (const t of targets) {
        const r = await tx.product.updateMany({ where: { id: t.id, OR: [{ trackStock: false }, { stockQty: { gte: qtyDec(t.qty) } }] }, data: { stockQty: { decrement: qtyDec(t.qty) } } });
        if (r.count === 0) throw new ApiError(409, "OUT_OF_STOCK");
        await tx.stockMovement.create({ data: { productId: t.id, delta: qtyDec(-t.qty), reason: "ORDER", refId: created.id } });
      }
    }
    return created;
  });
  return getOrder(order.id);
}
