import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import { can, isStaff, type Permission } from "@/lib/rbac";
import { DUMMY_HASH, verifyPassword } from "./password";

export const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "reef_session";
export const SESSION_TTL_MS = Number(process.env.SESSION_TTL_DAYS ?? 365) * 86_400_000;
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export interface AuthUser {
  id: string; name: string; phone: string; email: string | null; role: Role; locale: string; mustChangePassword: boolean; householdSize: number | null;
}

export class AuthError extends Error {
  constructor(public status: 401 | 403, public code: "UNAUTHENTICATED" | "FORBIDDEN") { super(code); }
}

/** Normalizes UAE numbers to +9715XXXXXXXX. Returns null when not a valid UAE mobile. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  if (d.startsWith("+971")) d = d.slice(4);
  else if (d.startsWith("971")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^5\d{8}$/.test(d) ? `+971${d}` : null;
}

export async function createSession(userId: string, meta: { ip?: string | null; userAgent?: string | null } = {}) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + SESSION_TTL_MS), ip: meta.ip ?? null, userAgent: meta.userAgent ?? null } });
  return token;
}

export const sessionCookie = (token: string) => ({
  name: COOKIE_NAME, value: token, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL_MS / 1000,
});

export async function login(phoneRaw: string, password: string, meta: { ip?: string | null; userAgent?: string | null } = {}) {
  const phone = normalizePhone(phoneRaw);
  const user = phone ? await prisma.user.findUnique({ where: { phone } }) : null;
  // customers have no password (OTP only): same uniform failure as unknown accounts
  if (!user || user.status !== "ACTIVE" || !user.passwordHash) { await verifyPassword(password, DUMMY_HASH); return null; }
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  const token = await createSession(user.id, meta);
  return { token, user: toAuthUser(user) };
}

export async function destroySession(token: string) {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

const toAuthUser = (u: { id: string; name: string; phone: string; email: string | null; role: Role; locale: string; mustChangePassword: boolean; householdSize: number | null }): AuthUser =>
  ({ id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role, locale: u.locale, mustChangePassword: u.mustChangePassword, householdSize: u.householdSize });

export async function userFromToken(token: string | undefined | null): Promise<AuthUser | null> {
  if (!token) return null;
  const s = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!s || s.expiresAt < new Date() || s.user.status !== "ACTIVE") return null;
  return toAuthUser(s.user);
}

/** Current user for the request (server components & route handlers). Memoized per request. */
export const currentUser = cache(async (): Promise<AuthUser | null> => {
  const jar = await cookies();
  return userFromToken(jar.get(COOKIE_NAME)?.value);
});

export async function requireUser(): Promise<AuthUser> {
  const u = await currentUser();
  if (!u) throw new AuthError(401, "UNAUTHENTICATED");
  return u;
}

export async function requireStaff(...perms: Permission[]): Promise<AuthUser> {
  const u = await requireUser();
  if (!isStaff(u.role) || perms.some((p) => !can(u.role, p))) throw new AuthError(403, "FORBIDDEN");
  return u;
}
