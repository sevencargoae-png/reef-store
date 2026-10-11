import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AuthError } from "@/lib/auth/session";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string, public details?: unknown) { super(message ?? code); }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ data }, init);
export const fail = (status: number, code: string, message?: string, details?: unknown) =>
  NextResponse.json({ error: { code, message: message ?? code, details } }, { status });

/** Wraps a route handler: zod → 422, ApiError → its status, AuthError → 401/403, anything else → 500. */
export function handler<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ZodError) return fail(422, "VALIDATION", "Invalid input", e.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
      if (e instanceof ApiError) return fail(e.status, e.code, e.message, e.details);
      if (e instanceof AuthError) return fail(e.status, e.code);
      console.error(e);
      return fail(500, "INTERNAL", "Unexpected error");
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try { json = await req.json(); } catch { throw new ApiError(400, "BAD_JSON", "Body must be JSON"); }
  return schema.parse(json);
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
