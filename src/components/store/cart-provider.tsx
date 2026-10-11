"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/client-api";
import type { CartDTO } from "@/lib/services/cart";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/messages";

interface Ctx {
  cart: CartDTO; loading: boolean; busy: string | null;
  setQty: (productId: string, qty: number) => Promise<void>;
  addMany: (items: { productId: string; qty: number }[]) => Promise<{ skipped: string[] }>;
  clear: () => Promise<void>; reload: () => Promise<void>;
  qtyOf: (productId: string) => number;
}
const EMPTY: CartDTO = { id: "", items: [], subtotal: 0, count: 0, adjusted: false };
const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ initial, children }: { initial?: CartDTO; children: React.ReactNode }) {
  const [cart, setCart] = useState<CartDTO>(initial ?? EMPTY);
  const [loading, setLoading] = useState(!initial);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const { t } = useI18n();

  const reload = useCallback(async () => { try { setCart(await api<CartDTO>("/api/cart")); } finally { setLoading(false); } }, []);
  useEffect(() => { if (!initial) void reload(); }, [initial, reload]);

  const onError = useCallback((e: unknown) => {
    const code = e instanceof ApiError ? e.code : "INTERNAL";
    toast.error(t(`error.${code}` as MessageKey));
  }, [toast, t]);

  const setQty = useCallback(async (productId: string, qty: number) => {
    setBusy(productId);
    try { setCart(await api<CartDTO>("/api/cart/items", { method: "PUT", json: { productId, qty } })); } catch (e) { onError(e); } finally { setBusy(null); }
  }, [onError]);

  const addMany = useCallback(async (items: { productId: string; qty: number }[]) => {
    try { const r = await api<CartDTO & { skipped: string[] }>("/api/cart/bulk", { method: "POST", json: { items } }); setCart(r); return { skipped: r.skipped }; } catch (e) { onError(e); return { skipped: items.map((i) => i.productId) }; }
  }, [onError]);

  const clear = useCallback(async () => { setCart(await api<CartDTO>("/api/cart", { method: "DELETE" })); }, []);
  const qtyOf = useCallback((id: string) => cart.items.find((i) => i.product.id === id)?.qty ?? 0, [cart]);

  const value = useMemo<Ctx>(() => ({ cart, loading, busy, setQty, addMany, clear, reload, qtyOf }), [cart, loading, busy, setQty, addMany, clear, reload, qtyOf]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
