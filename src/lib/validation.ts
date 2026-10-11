import { z } from "zod";
export const addressSchema = z.object({
  label: z.string().trim().min(1).max(40).default("home"),
  emirateId: z.string().min(1), areaId: z.string().min(1),
  street: z.string().trim().min(2).max(120), building: z.string().trim().min(1).max(120),
  unit: z.string().trim().max(60).optional().nullable(), notes: z.string().trim().max(200).optional().nullable(),
  isDefault: z.boolean().optional(),
});
export const placeOrderSchema = z.object({
  addressId: z.string().min(1), slotId: z.string().min(1), deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  couponCode: z.string().trim().max(40).optional().nullable(), notes: z.string().trim().max(500).optional().nullable(),
});
