import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { qtyDec, qtyNum, lineTotal } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { productInclude, toDTO, type ProductDTO } from "./catalog";
import type { AuthUser } from "@/lib/auth/session";

export const CART_COOKIE = "reef_cart";

export interface CartLine { product: ProductDTO; qty: number; lineTotal: number }
export interface CartDTO { id: string; items: CartLine[]; subtotal: number; count: number; adjusted: boolean }

/** Snaps a quantity to the product's step/min/max. */
export function clampQty(p: { step: number; minQty: number; maxQty: number | null; availableQty: number | null }, qty: number) {
  let q = Math.round(qty / p.step) * p.step;
  q = Math.max(p.minQty, q);
  if (p.maxQty != null) q = Math.min(p.maxQty, q);
  if (p.availableQty != null) q = Math.min(q, Math.floor(p.availableQty / p.step) * p.step);
  return qtyNum(q);
}

async function guestToken(create: boolean) {
  const jar = await cookies();
  let t = jar.get(CART_COOKIE)?.value;
  if (!t && create) {
    t = randomBytes(24).toString("base64url");
    jar.set({ name: CART_COOKIE, value: t, httpOnly: true, sameSite: "lax", path: "/", maxAge: 90 * 86400, secure: process.env.NODE_ENV === "production" });
  }
  return t ?? null;
}

/** Finds (or creates) the cart for the current visitor. A logged-in user's guest cart is merged into their account cart. */
export async function resolveCart(user: AuthUser | null, create = true) {
  const token = await guestToken(create && !user);
  if (user) {
    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart && create) cart = await prisma.cart.create({ data: { userId: user.id } });
    const guestTok = (await cookies()).get(CART_COOKIE)?.value;
    if (guestTok) {
      const guest = await prisma.cart.findUnique({ where: { token: guestTok }, include: { items: true } });
      if (guest && cart) {
        for (const it of guest.items) {
          await prisma.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId: it.productId } }, create: { cartId: cart.id, productId: it.productId, qty: it.qty }, update: { qty: it.qty } });
        }
        await prisma.cart.delete({ where: { id: guest.id } });
      }
      // Cookies are read-only while a page renders; the stale guest cookie is cleared on the next API call instead.
      try { (await cookies()).delete(CART_COOKIE); } catch { /* read-only render context */ }
    }
    return cart;
  }
  if (!token) return null;
  let cart = await prisma.cart.findUnique({ where: { token } });
  if (!cart && create) cart = await prisma.cart.create({ data: { token } });
  return cart;
}

export async function getCartDTO(user: AuthUser | null): Promise<CartDTO> {
  const cart = await resolveCart(user, false);
  if (!cart) return { id: "", items: [], subtotal: 0, count: 0, adjusted: false };
  const items = await prisma.cartItem.findMany({ where: { cartId: cart.id }, include: { product: { include: productInclude } }, orderBy: { id: "asc" } });
  let adjusted = false;
  const lines: CartLine[] = [];
  for (const it of items) {
    const p = toDTO(it.product);
    if (!it.product.isActive || !p.inStock) { await prisma.cartItem.delete({ where: { id: it.id } }); adjusted = true; continue; }
    const q = clampQty(p, qtyNum(it.qty));
    if (q !== qtyNum(it.qty)) { await prisma.cartItem.update({ where: { id: it.id }, data: { qty: qtyDec(q) } }); adjusted = true; }
    lines.push({ product: p, qty: q, lineTotal: lineTotal(p.price, q) });
  }
  return { id: cart.id, items: lines, subtotal: lines.reduce((s, l) => s + l.lineTotal, 0), count: lines.length, adjusted };
}

export async function setCartItem(user: AuthUser | null, productId: string, qty: number) {
  const cart = await resolveCart(user, true);
  if (!cart) throw new ApiError(500, "INTERNAL");
  const row = await prisma.product.findFirst({ where: { id: productId, isActive: true }, include: productInclude });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Product not found");
  if (qty <= 0) { await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } }); return; }
  const p = toDTO(row);
  if (!p.inStock) throw new ApiError(409, "OUT_OF_STOCK");
  const q = clampQty(p, qty);
  if (q <= 0) throw new ApiError(409, "OUT_OF_STOCK");
  await prisma.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId } }, create: { cartId: cart.id, productId, qty: qtyDec(q) }, update: { qty: qtyDec(q) } });
}

/** Adds quantities (used by reorder / lists / assistant). Skips unavailable products and reports them. */
export async function addManyToCart(user: AuthUser | null, items: { productId: string; qty: number }[]) {
  const cart = await resolveCart(user, true);
  if (!cart) throw new ApiError(500, "INTERNAL");
  const skipped: string[] = [];
  for (const it of items) {
    const row = await prisma.product.findFirst({ where: { id: it.productId, isActive: true }, include: productInclude });
    if (!row) { skipped.push(it.productId); continue; }
    const p = toDTO(row);
    if (!p.inStock) { skipped.push(it.productId); continue; }
    const existing = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId: it.productId } } });
    const q = clampQty(p, (existing ? qtyNum(existing.qty) : 0) + it.qty);
    await prisma.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId: it.productId } }, create: { cartId: cart.id, productId: it.productId, qty: qtyDec(q) }, update: { qty: qtyDec(q) } });
  }
  return { skipped };
}

export async function clearCart(user: AuthUser | null) {
  const cart = await resolveCart(user, false);
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}
