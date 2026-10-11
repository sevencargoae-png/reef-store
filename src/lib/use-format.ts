"use client";
import { useI18n } from "@/lib/i18n/provider";
import { formatAED } from "@/lib/money";
import type { MessageKey } from "@/lib/i18n/messages";

export function useFmt() {
  const { locale, t } = useI18n();
  return {
    money: (fils: number) => formatAED(fils, locale),
    qty: (q: number, unit: string) => `${Number.isInteger(q) ? q : q.toFixed(q * 1000 % 100 === 0 ? 1 : 2)} ${t(`unit.${unit}` as MessageKey)}`,
    date: (d: string | Date) => new Date(d).toLocaleDateString(locale === "ar" ? "ar-AE" : "en-AE", { year: "numeric", month: "short", day: "numeric" }),
    dateTime: (d: string | Date) => new Date(d).toLocaleString(locale === "ar" ? "ar-AE" : "en-AE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
  };
}
