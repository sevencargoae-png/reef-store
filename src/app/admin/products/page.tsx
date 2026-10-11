import { Suspense } from "react";
import { guardAdmin } from "@/lib/admin/guard";
import { NoAccess } from "@/components/admin/no-access";
import { ProductsView } from "@/components/admin/products-view";
import { prisma } from "@/lib/db";
export default async function Page() {
  const { allowed, user } = await guardAdmin("catalog.read");
  if (!allowed) return <NoAccess />;
  const [categories, suppliers] = await Promise.all([prisma.category.findMany({ orderBy: { sort: "asc" }, select: { id: true, nameAr: true, nameEn: true } }), prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  return <Suspense><ProductsView categories={categories} suppliers={suppliers} canWrite={["SUPER_ADMIN", "MANAGER", "OPERATIONS"].includes(user.role)} /></Suspense>;
}
