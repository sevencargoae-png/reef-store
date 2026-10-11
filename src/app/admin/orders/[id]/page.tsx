import { guardAdmin } from "@/lib/admin/guard";
import { NoAccess } from "@/components/admin/no-access";
import { OrderDetail } from "@/components/admin/orders-view";
import { can } from "@/lib/rbac";
export default async function Page({ params }: PageProps<"/admin/orders/[id]">) {
  const { allowed, user } = await guardAdmin("orders.read");
  const { id } = await params;
  return allowed ? <OrderDetail id={id} canWrite={can(user.role, "orders.write")} /> : <NoAccess />;
}
