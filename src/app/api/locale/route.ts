import { NextResponse } from "next/server";
import { LOCALES, type Locale } from "@/lib/i18n/messages";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

export async function POST(req: Request) {
  const { locale } = (await req.json().catch(() => ({}))) as { locale?: string };
  if (!LOCALES.includes(locale as Locale)) return NextResponse.json({ error: { code: "VALIDATION" } }, { status: 422 });
  const res = NextResponse.json({ data: { locale } });
  res.cookies.set({ name: LOCALE_COOKIE, value: locale!, path: "/", maxAge: 365 * 86400, sameSite: "lax" });
  return res;
}
