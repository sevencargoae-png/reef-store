import { describe, expect, it } from "vitest";
import { addDays, slotOpen, slotStartUtc, uaeToday, uaeWeekday } from "@/lib/dates";

describe("UAE dates & slots", () => {
  it("uaeToday rolls over at 20:00 UTC", () => {
    expect(uaeToday(new Date("2026-10-11T19:59:00Z"))).toBe("2026-10-11");
    expect(uaeToday(new Date("2026-10-11T20:00:00Z"))).toBe("2026-10-12");
  });
  it("weekday & addDays", () => {
    expect(uaeWeekday("2026-10-11")).toBe(0); // Sunday
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });
  it("slot start converts local 09:00 to 05:00Z and respects cutoff", () => {
    expect(slotStartUtc("2026-10-12", "09:00").toISOString()).toBe("2026-10-12T05:00:00.000Z");
    const s = { startTime: "09:00", cutoffHours: 12 };
    expect(slotOpen("2026-10-12", s, new Date("2026-10-11T16:59:00Z"))).toBe(true);
    expect(slotOpen("2026-10-12", s, new Date("2026-10-11T17:00:00Z"))).toBe(false);
  });
});
