"use client";
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: { path: string; message: string }[]) { super(message); }
}
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(path, { ...rest, headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...(rest.headers ?? {}) }, body: json !== undefined ? JSON.stringify(json) : rest.body, credentials: "same-origin" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body?.error?.code ?? "INTERNAL", body?.error?.message ?? "error", body?.error?.details);
  return body.data as T;
}
export const fieldErrors = (e: unknown) => e instanceof ApiError && e.details ? Object.fromEntries(e.details.map((d) => [d.path, d.message])) : {};
