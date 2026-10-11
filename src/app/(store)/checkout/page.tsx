import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { availableSlots, listAreas, listEmirates } from "@/lib/services/delivery";
import { getSettings } from "@/lib/settings";
import { listAddresses } from "@/lib/services/addresses";
import { Checkout } from "@/components/store/checkout";
import { getT } from "@/lib/i18n/server";

export default async function CheckoutPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/checkout");
  const { t } = await getT();
  const [emirates, areas, addresses, settings] = await Promise.all([listEmirates(), listAreas(), listAddresses(user.id), getSettings()]);
  const slots = await availableSlots(settings.bookingWindowDays);
  return (
    <div>
      <h1 className="pt-6 text-2xl font-extrabold text-reef-800">{t("checkout.title")}</h1>
      <Checkout geo={{ emirates, areas }} addresses={JSON.parse(JSON.stringify(addresses))} slots={slots} />
    </div>
  );
}
