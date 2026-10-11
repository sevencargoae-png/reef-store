import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { qtyDec, qtyNum } from "@/lib/money";
import { productInclude, toDTO, type ProductDTO } from "./catalog";

export interface ListDTO { id: string; name: string; isWeekly: boolean; updatedAt: string; items: { product: ProductDTO; qty: number }[] }

const include = { items: { include: { product: { include: productInclude } }, orderBy: { id: "asc" as const } } };
const toListDTO = (l: { id: string; name: string; isWeekly: boolean; updatedAt: Date; items: { qty: unknown; product: Parameters<typeof toDTO>[0] }[] }): ListDTO =>
  ({ id: l.id, name: l.name, isWeekly: l.isWeekly, updatedAt: l.updatedAt.toISOString(), items: l.items.map((i) => ({ product: toDTO(i.product), qty: qtyNum(i.qty as number) })) });

export async function myLists(userId: string) {
  const rows = await prisma.shoppingList.findMany({ where: { userId }, include, orderBy: [{ isWeekly: "desc" }, { updatedAt: "desc" }] });
  return rows.map(toListDTO);
}

export async function getList(userId: string, id: string) {
  const l = await prisma.shoppingList.findFirst({ where: { id, userId }, include });
  if (!l) throw new ApiError(404, "NOT_FOUND");
  return toListDTO(l);
}

export async function createList(userId: string, name: string, items: { productId: string; qty: number }[], isWeekly = false) {
  const valid = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) }, isActive: true }, select: { id: true } });
  const ok = new Set(valid.map((v) => v.id));
  if (isWeekly) await prisma.shoppingList.updateMany({ where: { userId, isWeekly: true }, data: { isWeekly: false } });
  const l = await prisma.shoppingList.create({ data: { userId, name, isWeekly, items: { create: items.filter((i) => ok.has(i.productId)).map((i) => ({ productId: i.productId, qty: qtyDec(i.qty) })) } }, include });
  return toListDTO(l);
}

export async function updateList(userId: string, id: string, patch: { name?: string; isWeekly?: boolean }) {
  const l = await prisma.shoppingList.findFirst({ where: { id, userId } });
  if (!l) throw new ApiError(404, "NOT_FOUND");
  if (patch.isWeekly) await prisma.shoppingList.updateMany({ where: { userId, isWeekly: true }, data: { isWeekly: false } });
  await prisma.shoppingList.update({ where: { id }, data: patch });
  return getList(userId, id);
}

export async function setListItem(userId: string, id: string, productId: string, qty: number) {
  const l = await prisma.shoppingList.findFirst({ where: { id, userId } });
  if (!l) throw new ApiError(404, "NOT_FOUND");
  if (qty <= 0) await prisma.shoppingListItem.deleteMany({ where: { listId: id, productId } });
  else {
    if (!(await prisma.product.findFirst({ where: { id: productId, isActive: true } }))) throw new ApiError(404, "NOT_FOUND");
    await prisma.shoppingListItem.upsert({ where: { listId_productId: { listId: id, productId } }, create: { listId: id, productId, qty: qtyDec(qty) }, update: { qty: qtyDec(qty) } });
  }
  await prisma.shoppingList.update({ where: { id }, data: { updatedAt: new Date() } });
  return getList(userId, id);
}

export async function deleteList(userId: string, id: string) {
  const r = await prisma.shoppingList.deleteMany({ where: { id, userId } });
  if (!r.count) throw new ApiError(404, "NOT_FOUND");
}
