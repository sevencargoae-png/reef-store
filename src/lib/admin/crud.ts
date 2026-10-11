/**
 * Generic admin CRUD route factory for simple reference models (categories, suppliers, areas, slots, coupons, emirates).
 * Each resource declares its Prisma delegate accessors, zod schemas, permission and searchable fields; routes get
 * RBAC, validation, pagination and audit logging for free.
 */
import type { ZodType } from "zod";
import { ApiError, clientIp, handler, ok, parseBody } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import type { Permission } from "@/lib/rbac";

export interface Delegate<T> {
  findMany(args: Record<string, unknown>): Promise<T[]>;
  count(args: Record<string, unknown>): Promise<number>;
  findUnique(args: Record<string, unknown>): Promise<T | null>;
  create(args: Record<string, unknown>): Promise<T>;
  update(args: Record<string, unknown>): Promise<T>;
  delete(args: Record<string, unknown>): Promise<T>;
}

export interface CrudSpec<T, C, U> {
  entity: string;
  delegate: () => Delegate<T>;
  createSchema: ZodType<C>;
  updateSchema: ZodType<U>;
  readPerm: Permission;
  writePerm: Permission;
  searchFields?: string[];
  orderBy?: Record<string, unknown>[];
  include?: Record<string, unknown>;
  /** Transform validated input before persisting (e.g. Decimal fields). */
  toData?: (input: Record<string, unknown>) => Record<string, unknown>;
  /** Extra where-filters supported via query string */
  filters?: Record<string, (v: string) => Record<string, unknown>>;
  deletable?: boolean;
}

export function crudRoutes<T extends { id: string }, C, U>(spec: CrudSpec<T, C, U>) {
  const list = handler(async (req) => {
    await requireStaff(spec.readPerm);
    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, Number(sp.get("page") ?? 1)); const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize") ?? 50)));
    const where: Record<string, unknown> = {};
    const q = sp.get("q")?.trim();
    if (q && spec.searchFields?.length) where.OR = spec.searchFields.map((f) => ({ [f]: { contains: q, mode: "insensitive" } }));
    for (const [k, fn] of Object.entries(spec.filters ?? {})) { const v = sp.get(k); if (v != null && v !== "") Object.assign(where, fn(v)); }
    const d = spec.delegate();
    const [items, total] = await Promise.all([d.findMany({ where, orderBy: spec.orderBy, include: spec.include, skip: (page - 1) * pageSize, take: pageSize }), d.count({ where })]);
    return ok({ items, meta: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } });
  });
  const create = handler(async (req) => {
    const u = await requireStaff(spec.writePerm);
    const input = await parseBody(req, spec.createSchema) as Record<string, unknown>;
    const row = await spec.delegate().create({ data: spec.toData ? spec.toData(input) : input, include: spec.include });
    await audit({ userId: u.id, action: `${spec.entity}.create`, entity: spec.entity, entityId: row.id, after: row, ip: clientIp(req) });
    return ok(row, { status: 201 });
  });
  type Ctx = { params: Promise<{ id: string }> };
  const get = handler<Ctx>(async (_r, { params }) => {
    await requireStaff(spec.readPerm);
    const row = await spec.delegate().findUnique({ where: { id: (await params).id }, include: spec.include });
    if (!row) throw new ApiError(404, "NOT_FOUND");
    return ok(row);
  });
  const update = handler<Ctx>(async (req, { params }) => {
    const u = await requireStaff(spec.writePerm);
    const { id } = await params;
    const before = await spec.delegate().findUnique({ where: { id } });
    if (!before) throw new ApiError(404, "NOT_FOUND");
    const input = await parseBody(req, spec.updateSchema) as Record<string, unknown>;
    const row = await spec.delegate().update({ where: { id }, data: spec.toData ? spec.toData(input) : input, include: spec.include });
    await audit({ userId: u.id, action: `${spec.entity}.update`, entity: spec.entity, entityId: id, before, after: row, ip: clientIp(req) });
    return ok(row);
  });
  const remove = handler<Ctx>(async (req, { params }) => {
    const u = await requireStaff(spec.writePerm);
    if (spec.deletable === false) throw new ApiError(405, "FORBIDDEN");
    const { id } = await params;
    const before = await spec.delegate().findUnique({ where: { id } });
    if (!before) throw new ApiError(404, "NOT_FOUND");
    try { await spec.delegate().delete({ where: { id } }); }
    catch { throw new ApiError(409, "IN_USE", "Record is referenced by other data; deactivate it instead"); }
    await audit({ userId: u.id, action: `${spec.entity}.delete`, entity: spec.entity, entityId: id, before, ip: clientIp(req) });
    return ok({ ok: true });
  });
  return { list, create, get, update, remove };
}
