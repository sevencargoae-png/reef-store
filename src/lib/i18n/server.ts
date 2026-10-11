import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, translate, type Locale, type MessageKey } from "./messages";

export const LOCALE_COOKIE = "reef_locale";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return LOCALES.includes(v as Locale) ? (v as Locale) : DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: (k: MessageKey, vars?: Record<string, string | number>) => translate(locale, k, vars) };
}
