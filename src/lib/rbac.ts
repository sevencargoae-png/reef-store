import type { Role } from "@/generated/prisma/enums";

export const PERMISSIONS = [
  "catalog.read", "catalog.write",
  "orders.read", "orders.write",
  "customers.read", "customers.write",
  "delivery.write",
  "promotions.write",
  "subscriptions.read",
  "reports.read",
  "users.write",
  "settings.write",
  "audit.read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL = [...PERMISSIONS];
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL,
  MANAGER: ALL.filter((p) => p !== "users.write"),
  OPERATIONS: ["catalog.read", "catalog.write", "orders.read", "orders.write", "customers.read", "delivery.write", "subscriptions.read"],
  SUPPORT: ["catalog.read", "orders.read", "orders.write", "customers.read", "customers.write", "subscriptions.read"],
  CUSTOMER: [],
};

export const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER", "OPERATIONS", "SUPPORT"];
export const isStaff = (r: Role) => STAFF_ROLES.includes(r);
export const can = (role: Role, p: Permission) => ROLE_PERMISSIONS[role].includes(p);
