import { z } from "zod";
import { NextResponse } from "next/server";
import { clientIp, fail, handler, parseBody } from "@/lib/api";
import { login, sessionCookie } from "@/lib/auth/session";

const schema = z.object({ phone: z.string().min(6), password: z.string().min(1) });

export const POST = handler(async (req) => {
  const { phone, password } = await parseBody(req, schema);
  const r = await login(phone, password, { ip: clientIp(req), userAgent: req.headers.get("user-agent") });
  if (!r) return fail(401, "INVALID_CREDENTIALS");
  const res = NextResponse.json({ data: r.user });
  res.cookies.set(sessionCookie(r.token));
  return res;
});
