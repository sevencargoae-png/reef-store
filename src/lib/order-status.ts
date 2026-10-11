import type { OrderStatus } from "@/generated/prisma/enums";

/** Allowed status transitions (pure module: safe to import from client components). */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};
/** Customers may cancel only before preparation starts. */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED"];
