/** UAE calendar helpers (fixed UTC+4, no DST). Pure module: safe for client and server. */
export const UAE_OFFSET_MIN = 240;
export function uaeToday(now = new Date()): string {
  return new Date(now.getTime() + UAE_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}
export function uaeWeekday(dateISO: string) { return new Date(`${dateISO}T00:00:00Z`).getUTCDay(); }
export function addDays(dateISO: string, n: number) { const d = new Date(`${dateISO}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
/** Instant at which a slot starts, in UTC. */
export function slotStartUtc(dateISO: string, startTime: string) {
  const [h, m] = startTime.split(":").map(Number);
  return new Date(Date.parse(`${dateISO}T00:00:00Z`) + (h * 60 + m - UAE_OFFSET_MIN) * 60_000);
}
export const slotOpen = (dateISO: string, s: { startTime: string; cutoffHours: number }, now = new Date()) =>
  slotStartUtc(dateISO, s.startTime).getTime() - s.cutoffHours * 3_600_000 > now.getTime();
