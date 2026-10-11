import { requireUser } from "@/lib/auth/session";
import { listMyOrders } from "@/lib/services/orders";
import { OrdersView } from "@/components/store/account-views";
import { getT } from "@/lib/i18n/server";
export default async function OrdersPage() {
  const u = await requireUser(); const { t } = await getT();
  const { items } = await listMyOrders(u.id, 1, 50);
  return <div><h1 className="mb-4 text-2xl font-extrabold text-reef-800">{t("orders.title")}</h1><OrdersView orders={items} /></div>;
}
