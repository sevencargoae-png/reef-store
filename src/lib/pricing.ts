/** Pure pricing math (fils). Shared by cart preview, checkout and preparation re-pricing; unit-tested. */
export interface PriceLine { price: number; qty: number; vatApplicable: boolean }
export interface CouponRule { type: "PERCENT" | "FIXED"; value: number /* percent or fils */; maxDiscount: number | null }
export interface VatSettings { vatEnabled: boolean; vatRate: number; pricesIncludeVat: boolean }
export interface Quote { subtotal: number; discount: number; deliveryFee: number; vatRate: number; vatAmount: number; total: number; lines: number[] }

export const lineOf = (l: PriceLine) => Math.round(l.price * l.qty);

export function couponDiscount(subtotal: number, c: CouponRule | null): number {
  if (!c || subtotal <= 0) return 0;
  let d = c.type === "PERCENT" ? Math.round((subtotal * c.value) / 100) : c.value;
  if (c.maxDiscount != null) d = Math.min(d, c.maxDiscount);
  return Math.max(0, Math.min(d, subtotal));
}

export function deliveryFeeFor(area: { deliveryFee: number; freeDeliveryThreshold: number | null } | null, netGoods: number): number {
  if (!area) return 0;
  if (area.freeDeliveryThreshold != null && netGoods >= area.freeDeliveryThreshold) return 0;
  return area.deliveryFee;
}

export function quote(lines: PriceLine[], opts: { coupon?: CouponRule | null; area?: { deliveryFee: number; freeDeliveryThreshold: number | null } | null; vat: VatSettings }): Quote {
  const lineTotals = lines.map(lineOf);
  const subtotal = lineTotals.reduce((a, b) => a + b, 0);
  const discount = couponDiscount(subtotal, opts.coupon ?? null);
  const net = subtotal - discount;
  const deliveryFee = deliveryFeeFor(opts.area ?? null, net);
  let vatAmount = 0;
  const rate = opts.vat.vatEnabled ? opts.vat.vatRate : 0;
  if (rate > 0) {
    // discount is spread proportionally over taxable goods
    const taxableGoods = lines.reduce((s, l, i) => s + (l.vatApplicable ? lineTotals[i] : 0), 0);
    const taxableNet = subtotal > 0 ? Math.round(taxableGoods * (net / subtotal)) : 0;
    const base = taxableNet + deliveryFee;
    vatAmount = opts.vat.pricesIncludeVat ? Math.round(base - base / (1 + rate)) : Math.round(base * rate);
  }
  const total = net + deliveryFee + (opts.vat.pricesIncludeVat ? 0 : vatAmount);
  return { subtotal, discount, deliveryFee, vatRate: rate, vatAmount, total, lines: lineTotals };
}
