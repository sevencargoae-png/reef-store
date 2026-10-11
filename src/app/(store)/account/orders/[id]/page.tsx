import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getOrder } from "@/lib/services/orders";
import { OrderDetailView } from "@/components/store/account-views";
export default async function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const u = await requireUser(); const { id } = await params;
  const o = await getOrder(id);
  if (!o || o.customer.id !== u.id) notFound();
  return <OrderDetailView order={o} />;
}
