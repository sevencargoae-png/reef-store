import { z } from "zod";
import { NextResponse } from "next/server";
import { clientIp, fail, handler, parseBody } from "@/lib/api";
import { createSession, normalizePhone, sessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ phone: z.string().min(6).max(20), name: z.string().trim().min(2).max(80).optional() });

/**
 * Customer sign-in by mobile number only (no password, no code) — chosen for a frictionless experience.
 * A new number with a name creates the account; a new number without a name answers { isNew: true } so the UI asks for it.
 */
export const POST = handler(async (req) => {
  if (!rateLimit(`login:${clientIp(req) ?? "local"}`, 20, 10 * 60_000)) return fail(429, "RATE_LIMIT");
  const b = await parseBody(req, schema);
  const phone = normalizePhone(b.phone);
  if (!phone) return fail(422, "INVALID_PHONE", "Invalid phone", [{ path: "phone", message: "INVALID_PHONE" }]);
  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    if (!b.name) return NextResponse.json({ data: { isNew: true, phone } });
    user = await prisma.user.create({ data: { phone, name: b.name, role: "CUSTOMER", locale: await getLocale() } });
  } else if (user.status !== "ACTIVE") return fail(403, "FORBIDDEN");
  const token = await createSession(user.id, { ip: clientIp(req), userAgent: req.headers.get("user-agent") });
  const res = NextResponse.json({ data: { isNew: false, id: user.id, name: user.name, phone: user.phone, role: user.role } });
  res.cookies.set(sessionCookie(token));
  return res;
});
