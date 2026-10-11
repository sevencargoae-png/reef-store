import { requireUser } from "@/lib/auth/session";
import { listAddresses } from "@/lib/services/addresses";
import { listAreas, listEmirates } from "@/lib/services/delivery";
import { AddressesView } from "@/components/store/account-views";
export default async function AddressesPage() {
  const u = await requireUser();
  const [emirates, areas, addresses] = await Promise.all([listEmirates(), listAreas(), listAddresses(u.id)]);
  return <AddressesView geo={{ emirates, areas }} addresses={JSON.parse(JSON.stringify(addresses))} />;
}
