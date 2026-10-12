import { guardAdmin } from "@/lib/admin/guard";
import { NoAccess } from "@/components/admin/no-access";
import { ScanPage } from "@/components/admin/scan-page";
export default async function Page() {
  const { allowed } = await guardAdmin("orders.read");
  if (!allowed) return <NoAccess />;
  return <ScanPage />;
}
