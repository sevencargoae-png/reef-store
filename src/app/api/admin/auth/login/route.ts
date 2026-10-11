import { z } from "zod";
import { NextResponse } from "next/server";
import { clientIp, fail, handler, parseBody } from "@/lib/api";
import { login, sessionCookie } from "@/lib/auth/session";
import { isStaff } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/** Staff sign-in: phone + password (customers never have a password). */
export const POST = handler(async (req) => {
  if (!rateLimit(`staff-login:${clientIp(req) ?? "local"}`, 10, 10 * 60_000)) return fail(429, "RATE_LIMIT");
  const { phone, password } = await parseBody(req, z.object({ phone: z.string().min(6), password: z.string().min(1) }));
  const r = await login(phone, password, { ip: clientIp(req), userAgent: req.headers.get("user-agent") });
  if (!r || !isStaff(r.user.role)) { await audit({ action: "security.staff_login_failed", entity: "User", after: { phone }, ip: clientIp(req) }); return fail(401, "INVALID_CREDENTIALS"); }
  await audit({ userId: r.user.id, action: "security.staff_login", entity: "User", entityId: r.user.id, ip: clientIp(req) });
  const res = NextResponse.json({ data: r.user });
  res.cookies.set(sessionCookie(r.token));
  return res;
});
