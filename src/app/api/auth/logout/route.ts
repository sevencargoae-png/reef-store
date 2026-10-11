import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handler } from "@/lib/api";
import { COOKIE_NAME, destroySession } from "@/lib/auth/session";

export const POST = handler(async () => {
  const jar = await cookies();
  const t = jar.get(COOKIE_NAME)?.value;
  if (t) await destroySession(t);
  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return res;
});
