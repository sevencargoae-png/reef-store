import { prisma } from "@/lib/db";
import { toFils } from "@/lib/money";

export { UAE_OFFSET_MIN, uaeToday, uaeWeekday, addDays, slotStartUtc, slotOpen } from "@/lib/dates";
import { uaeToday, uaeWeekday, addDays, slotOpen } from "@/lib/dates";

export interface AreaDTO { id: string; emirateId: string; emirateCode: string; emirateNameAr: string; emirateNameEn: string; nameAr: string; nameEn: string; deliveryFee: number; freeDeliveryThreshold: number | null; minOrder: number; active: boolean }

export async function listEmirates() {
  return prisma.emirate.findMany({ orderBy: { sort: "asc" }, select: { id: true, code: true, nameAr: true, nameEn: true, active: true } });
}

export async function listAreas(opts: { onlyActive?: boolean; emirateId?: string } = { onlyActive: true }): Promise<AreaDTO[]> {
  const rows = await prisma.area.findMany({ where: { ...(opts.onlyActive ? { active: true, emirate: { active: true } } : {}), ...(opts.emirateId ? { emirateId: opts.emirateId } : {}) }, include: { emirate: true }, orderBy: [{ emirate: { sort: "asc" } }, { sort: "asc" }, { nameAr: "asc" }] });
  return rows.map((a) => ({ id: a.id, emirateId: a.emirateId, emirateCode: a.emirate.code, emirateNameAr: a.emirate.nameAr, emirateNameEn: a.emirate.nameEn, nameAr: a.nameAr, nameEn: a.nameEn, deliveryFee: toFils(a.deliveryFee), freeDeliveryThreshold: a.freeDeliveryThreshold ? toFils(a.freeDeliveryThreshold) : null, minOrder: toFils(a.minOrder), active: a.active }));
}

export interface SlotOption { slotId: string; date: string; weekday: number; startTime: string; endTime: string; label: string; remaining: number }

/** Bookable (date, slot) pairs inside the booking window: open by cutoff and with capacity left. */
export async function availableSlots(windowDays: number, now = new Date()): Promise<SlotOption[]> {
  const slots = await prisma.deliverySlot.findMany({ where: { active: true }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] });
  const today = uaeToday(now);
  const dates = Array.from({ length: windowDays + 1 }, (_, i) => addDays(today, i));
  const booked = await prisma.order.groupBy({ by: ["slotId", "deliveryDate"], where: { status: { not: "CANCELLED" }, deliveryDate: { gte: new Date(`${dates[0]}T00:00:00Z`), lte: new Date(`${dates.at(-1)}T00:00:00Z`) } }, _count: { _all: true } });
  const used = new Map(booked.map((b) => [`${b.slotId}|${b.deliveryDate?.toISOString().slice(0, 10)}`, b._count._all]));
  const out: SlotOption[] = [];
  for (const date of dates) {
    const wd = uaeWeekday(date);
    for (const s of slots) {
      if (s.weekday !== wd || !slotOpen(date, s, now)) continue;
      const remaining = s.capacity - (used.get(`${s.id}|${date}`) ?? 0);
      if (remaining <= 0) continue;
      out.push({ slotId: s.id, date, weekday: wd, startTime: s.startTime, endTime: s.endTime, label: `${s.startTime}–${s.endTime}`, remaining });
    }
  }
  return out;
}
