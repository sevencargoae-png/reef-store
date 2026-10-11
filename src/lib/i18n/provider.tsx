"use client";
import { createContext, useContext, useMemo } from "react";
import { translate, type Locale, type MessageKey } from "./messages";

interface Ctx { locale: Locale; dir: "rtl" | "ltr"; t: (k: MessageKey, vars?: Record<string, string | number>) => string }
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<Ctx>(() => ({ locale, dir: locale === "ar" ? "rtl" : "ltr", t: (k, vars) => translate(locale, k, vars) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n outside I18nProvider");
  return c;
}

/** Picks the localized field of a bilingual record: pick(p, "name") → p.nameAr | p.nameEn */
export function useLocalized() {
  const { locale } = useI18n();
  return <T extends object>(obj: T, field: string): string => {
    const o = obj as Record<string, unknown>;
    const v = o[`${field}${locale === "ar" ? "Ar" : "En"}`] ?? o[`${field}Ar`];
    return (v as string) ?? "";
  };
}
