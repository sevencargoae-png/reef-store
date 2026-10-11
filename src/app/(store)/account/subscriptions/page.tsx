import { requireUser } from "@/lib/auth/session";
import { mySubscriptions } from "@/lib/services/subscriptions";
import { listAddresses } from "@/lib/services/addresses";
import { prisma } from "@/lib/db";
import { SubscriptionsView } from "@/components/store/account-views";
export default async function SubsPage() {
  const u = await requireUser();
  const [subs, addresses, slots] = await Promise.all([mySubscriptions(u.id), listAddresses(u.id), prisma.deliverySlot.findMany({ where: { active: true }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] })]);
  return <SubscriptionsView subs={subs} addresses={JSON.parse(JSON.stringify(addresses))} slots={slots.map((s) => ({ id: s.id, weekday: s.weekday, label: `${s.startTime}–${s.endTime}` }))} />;
}
