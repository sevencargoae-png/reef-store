import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getProductsByIds } from "@/lib/services/catalog";
import { WishlistView } from "@/components/store/account-views";
import { getT } from "@/lib/i18n/server";
export default async function WishlistPage() {
  const u = await requireUser(); const { t } = await getT();
  const ids = (await prisma.wishlistItem.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" } })).map((w) => w.productId);
  const products = await getProductsByIds(ids);
  return <div><h1 className="mb-4 text-2xl font-extrabold text-reef-800">{t("account.wishlist")}</h1><WishlistView products={products.filter((p) => p)} /></div>;
}
