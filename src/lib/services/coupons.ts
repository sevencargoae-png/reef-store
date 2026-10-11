import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api";
import { toFils } from "@/lib/money";
import type { CouponRule } from "@/lib/pricing";

type Db = Prisma.TransactionClient | typeof prisma;

/** Validates a coupon for a user & subtotal; throws ApiError with a specific code. */
export async function validateCoupon(db: Db, code: string, userId: string | null, subtotalFils: number): Promise<{ id: string; code: string; rule: CouponRule }> {
  const c = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.active) throw new ApiError(400, "COUPON_INVALID");
  const now = new Date();
  if ((c.startsAt && c.startsAt > now) || (c.endsAt && c.endsAt < now)) throw new ApiError(400, "COUPON_EXPIRED");
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) throw new ApiError(400, "COUPON_LIMIT");
  if (toFils(c.minOrder) > subtotalFils) throw new ApiError(400, "COUPON_MIN");
  if (c.perUserLimit != null && userId) {
    const used = await db.couponUse.count({ where: { couponId: c.id, userId } });
    if (used >= c.perUserLimit) throw new ApiError(400, "COUPON_LIMIT");
  }
  return { id: c.id, code: c.code, rule: { type: c.type, value: c.type === "PERCENT" ? Number(c.value) : toFils(c.value), maxDiscount: c.maxDiscount ? toFils(c.maxDiscount) : null } };
}
