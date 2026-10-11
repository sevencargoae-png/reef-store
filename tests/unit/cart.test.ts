import { describe, expect, it } from "vitest";
import { clampQty } from "@/lib/services/cart";

describe("clampQty", () => {
  const kg = { step: 0.5, minQty: 0.5, maxQty: null, availableQty: 3.2 };
  it("snaps to step and respects min", () => {
    expect(clampQty(kg, 0.3)).toBe(0.5);
    expect(clampQty(kg, 1.26)).toBe(1.5);
  });
  it("never exceeds available stock (floored to step)", () => {
    expect(clampQty(kg, 500)).toBe(3);
  });
  it("respects maxQty", () => {
    expect(clampQty({ ...kg, maxQty: 2 }, 5)).toBe(2);
  });
  it("untracked stock is unlimited", () => {
    expect(clampQty({ step: 1, minQty: 1, maxQty: null, availableQty: null }, 40)).toBe(40);
  });
});
