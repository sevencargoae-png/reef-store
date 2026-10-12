import { z } from "zod";
import { prisma } from "@/lib/db";
import { crudRoutes, type Delegate } from "./crud";

const money = z.number().min(0).max(1_000_000);
const d = <T>(x: unknown) => x as Delegate<T>;

export const categories = crudRoutes({
  entity: "Category", delegate: () => d<{ id: string }>(prisma.category), readPerm: "catalog.read", writePerm: "catalog.write",
  searchFields: ["nameAr", "nameEn", "slug"], orderBy: [{ sort: "asc" }], include: { _count: { select: { products: true } } },
  createSchema: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), nameAr: z.string().min(1), nameEn: z.string().min(1), descAr: z.string().nullable().optional(), descEn: z.string().nullable().optional(), image: z.string().nullable().optional(), parentId: z.string().nullable().optional(), sort: z.number().int().default(0), active: z.boolean().default(true), showOnHome: z.boolean().default(true) }),
  updateSchema: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/).optional(), nameAr: z.string().min(1).optional(), nameEn: z.string().min(1).optional(), descAr: z.string().nullable().optional(), descEn: z.string().nullable().optional(), image: z.string().nullable().optional(), parentId: z.string().nullable().optional(), sort: z.number().int().optional(), active: z.boolean().optional(), showOnHome: z.boolean().optional() }),
});

export const suppliers = crudRoutes({
  entity: "Supplier", delegate: () => d<{ id: string }>(prisma.supplier), readPerm: "catalog.read", writePerm: "catalog.write",
  searchFields: ["name", "phone", "email"], orderBy: [{ name: "asc" }], include: { _count: { select: { products: true } } },
  createSchema: z.object({ name: z.string().min(1), phone: z.string().nullable().optional(), email: z.string().email().nullable().optional().or(z.literal("")), notes: z.string().nullable().optional(), active: z.boolean().default(true) }),
  updateSchema: z.object({ name: z.string().min(1).optional(), phone: z.string().nullable().optional(), email: z.string().email().nullable().optional().or(z.literal("")), notes: z.string().nullable().optional(), active: z.boolean().optional() }),
  toData: (i) => ({ ...i, email: i.email === "" ? null : i.email }),
});

export const emirates = crudRoutes({
  entity: "Emirate", delegate: () => d<{ id: string }>(prisma.emirate), readPerm: "delivery.write", writePerm: "delivery.write", orderBy: [{ sort: "asc" }], deletable: false,
  createSchema: z.object({ code: z.string().min(2).max(5), nameAr: z.string().min(1), nameEn: z.string().min(1), active: z.boolean().default(true), sort: z.number().int().default(0) }),
  updateSchema: z.object({ nameAr: z.string().min(1).optional(), nameEn: z.string().min(1).optional(), active: z.boolean().optional(), sort: z.number().int().optional() }),
});

export const areas = crudRoutes({
  entity: "Area", delegate: () => d<{ id: string }>(prisma.area), readPerm: "delivery.write", writePerm: "delivery.write",
  searchFields: ["nameAr", "nameEn"], orderBy: [{ emirate: { sort: "asc" } }, { sort: "asc" }, { nameAr: "asc" }], include: { emirate: true },
  filters: { emirateId: (v) => ({ emirateId: v }) },
  createSchema: z.object({ emirateId: z.string().min(1), nameAr: z.string().min(1), nameEn: z.string().min(1), deliveryFee: money, freeDeliveryThreshold: money.nullable().optional(), minOrder: money.default(0), active: z.boolean().default(true), sort: z.number().int().default(0) }),
  updateSchema: z.object({ emirateId: z.string().min(1).optional(), nameAr: z.string().min(1).optional(), nameEn: z.string().min(1).optional(), deliveryFee: money.optional(), freeDeliveryThreshold: money.nullable().optional(), minOrder: money.optional(), active: z.boolean().optional(), sort: z.number().int().optional() }),
});

export const complaints = crudRoutes({
  entity: "Complaint", delegate: () => d<{ id: string }>(prisma.complaint), readPerm: "customers.read", writePerm: "customers.write",
  searchFields: ["name", "phone", "subject"], orderBy: [{ createdAt: "desc" }], include: { user: { select: { name: true } }, order: { select: { number: true } } },
  createSchema: z.object({ name: z.string().min(1), phone: z.string().min(1), subject: z.string().min(1), body: z.string().min(1), status: z.string().default("OPEN"), userId: z.string().nullable().optional(), orderId: z.string().nullable().optional() }),
  updateSchema: z.object({ status: z.string().optional(), resolution: z.string().nullable().optional(), subject: z.string().optional(), body: z.string().optional() }),
});

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const slots = crudRoutes({
  entity: "DeliverySlot", delegate: () => d<{ id: string }>(prisma.deliverySlot), readPerm: "delivery.write", writePerm: "delivery.write", orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  createSchema: z.object({ weekday: z.number().int().min(0).max(6), startTime: hhmm, endTime: hhmm, capacity: z.number().int().min(0).max(10000), cutoffHours: z.number().int().min(0).max(168).default(12), active: z.boolean().default(true) }).refine((s) => s.startTime < s.endTime, { message: "endTime must be after startTime", path: ["endTime"] }),
  updateSchema: z.object({ weekday: z.number().int().min(0).max(6).optional(), startTime: hhmm.optional(), endTime: hhmm.optional(), capacity: z.number().int().min(0).max(10000).optional(), cutoffHours: z.number().int().min(0).max(168).optional(), active: z.boolean().optional() }),
});

export const coupons = crudRoutes({
  entity: "Coupon", delegate: () => d<{ id: string }>(prisma.coupon), readPerm: "promotions.write", writePerm: "promotions.write", searchFields: ["code"], orderBy: [{ createdAt: "desc" }],
  createSchema: z.object({ code: z.string().min(2).max(40).transform((s) => s.toUpperCase().trim()), type: z.enum(["PERCENT", "FIXED"]), value: z.number().positive(), minOrder: money.default(0), maxDiscount: money.nullable().optional(), startsAt: z.string().datetime().nullable().optional(), endsAt: z.string().datetime().nullable().optional(), usageLimit: z.number().int().min(1).nullable().optional(), perUserLimit: z.number().int().min(1).nullable().optional(), active: z.boolean().default(true) }),
  updateSchema: z.object({ code: z.string().min(2).max(40).transform((s) => s.toUpperCase().trim()).optional(), type: z.enum(["PERCENT", "FIXED"]).optional(), value: z.number().positive().optional(), minOrder: money.optional(), maxDiscount: money.nullable().optional(), startsAt: z.string().datetime().nullable().optional(), endsAt: z.string().datetime().nullable().optional(), usageLimit: z.number().int().min(1).nullable().optional(), perUserLimit: z.number().int().min(1).nullable().optional(), active: z.boolean().optional() }),
});
