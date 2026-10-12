import { prisma } from "@/lib/db";

export interface StoreSettings {
  storeNameAr: string;
  storeNameEn: string;
  currency: "AED";
  vatEnabled: boolean;
  vatRate: number; // 0.05
  pricesIncludeVat: boolean;
  codEnabled: boolean;
  minOrderAed: number;
  /** Shown on the home page only when set by the admin (no unconfirmed promises). */
  deliveryPromiseAr: string;
  deliveryPromiseEn: string;
  supportPhone: string;
  supportWhatsapp: string;
  /** How many days ahead customers can book a slot */
  bookingWindowDays: number;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeNameAr: "ريف", storeNameEn: "Reeef", currency: "AED",
  vatEnabled: false, vatRate: 0.05, pricesIncludeVat: true,
  codEnabled: true, minOrderAed: 0,
  deliveryPromiseAr: "", deliveryPromiseEn: "",
  supportPhone: "", supportWhatsapp: "",
  bookingWindowDays: 7,
};

const KEY = "store";

export async function getSettings(): Promise<StoreSettings> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<StoreSettings>) ?? {}) };
}

export async function saveSettings(patch: Partial<StoreSettings>) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await prisma.setting.upsert({ where: { key: KEY }, create: { key: KEY, value: next }, update: { value: next } });
  return next;
}
