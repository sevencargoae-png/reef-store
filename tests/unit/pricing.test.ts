import { describe, expect, it } from "vitest";
import { couponDiscount, deliveryFeeFor, quote } from "@/lib/pricing";

const vatOff = { vatEnabled: false, vatRate: 0.05, pricesIncludeVat: true };
const vatIncl = { vatEnabled: true, vatRate: 0.05, pricesIncludeVat: true };
const vatExcl = { vatEnabled: true, vatRate: 0.05, pricesIncludeVat: false };

describe("pricing", () => {
  it("rounds weight lines to fils", () => {
    const q = quote([{ price: 1250, qty: 0.75, vatApplicable: true }], { vat: vatOff });
    expect(q.lines[0]).toBe(938); // 9.375 → 9.38
    expect(q.total).toBe(938);
  });
  it("percent coupon with cap", () => {
    expect(couponDiscount(113700, { type: "PERCENT", value: 10, maxDiscount: 3000 })).toBe(3000);
    expect(couponDiscount(20000, { type: "PERCENT", value: 10, maxDiscount: 3000 })).toBe(2000);
    expect(couponDiscount(2000, { type: "FIXED", value: 5000, maxDiscount: null })).toBe(2000); // never below zero
  });
  it("free delivery above threshold uses net goods", () => {
    const area = { deliveryFee: 1000, freeDeliveryThreshold: 15000 };
    expect(deliveryFeeFor(area, 14999)).toBe(1000);
    expect(deliveryFeeFor(area, 15000)).toBe(0);
    const q = quote([{ price: 10000, qty: 1.5, vatApplicable: true }], { coupon: { type: "FIXED", value: 100, maxDiscount: null }, area, vat: vatOff });
    expect(q.deliveryFee).toBe(1000); // 15000 - 100 < threshold
  });
  it("VAT inclusive: total unchanged, vat extracted", () => {
    const q = quote([{ price: 10500, qty: 1, vatApplicable: true }], { vat: vatIncl });
    expect(q.total).toBe(10500);
    expect(q.vatAmount).toBe(500);
  });
  it("VAT exclusive: vat added, non-taxable lines excluded, discount spread", () => {
    const q = quote([{ price: 10000, qty: 1, vatApplicable: true }, { price: 10000, qty: 1, vatApplicable: false }], { coupon: { type: "PERCENT", value: 10, maxDiscount: null }, area: { deliveryFee: 1000, freeDeliveryThreshold: null }, vat: vatExcl });
    expect(q.discount).toBe(2000);
    // taxable net = 10000 * (18000/20000) = 9000, + delivery 1000 → 10000 * 5% = 500
    expect(q.vatAmount).toBe(500);
    expect(q.total).toBe(18000 + 1000 + 500);
  });
});
