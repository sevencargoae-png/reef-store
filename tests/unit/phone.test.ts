import { describe, expect, it } from "vitest";
import { normalizePhone } from "@/lib/auth/session";

describe("normalizePhone", () => {
  it("accepts UAE mobile formats", () => {
    for (const v of ["0501234567", "501234567", "+971501234567", "971501234567", "00971 50 123 4567", "050-123-4567"]) expect(normalizePhone(v)).toBe("+971501234567");
  });
  it("rejects landlines and foreign numbers", () => {
    for (const v of ["041234567", "+201001234567", "123", "+97150123456"]) expect(normalizePhone(v)).toBeNull();
  });
});
