/** All money math happens in integer fils (1 AED = 100 fils) to avoid float drift. */
import { Decimal } from "@prisma/client/runtime/client";

export type Money = number; // fils

export const toFils = (v: Decimal | number | string | null | undefined): Money =>
  v == null ? 0 : Math.round(Number(v) * 100);
export const fromFils = (f: Money) => (f / 100).toFixed(2);
export const dec = (f: Money) => new Decimal(fromFils(f));

/** Quantities keep 3 decimals (kg). Stored as Decimal(10,3). */
export const qtyNum = (v: Decimal | number | string | null | undefined) => (v == null ? 0 : Math.round(Number(v) * 1000) / 1000);
export const qtyDec = (n: number) => new Decimal(qtyNum(n).toFixed(3));

/** line = unitPrice × qty, rounded half-up to fils */
export const lineTotal = (unitPriceFils: Money, qty: number): Money => Math.round(unitPriceFils * qty);

export function formatAED(fils: Money, locale: "ar" | "en" = "ar") {
  const n = (fils / 100).toLocaleString(locale === "ar" ? "ar-AE" : "en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return locale === "ar" ? `${n} د.إ` : `AED ${n}`;
}
