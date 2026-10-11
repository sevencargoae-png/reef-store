import { guardAdmin } from "@/lib/admin/guard";
import { NoAccess } from "@/components/admin/no-access";
import { CustomersList } from "@/components/admin/customers-view";
export default async function Page() { const { allowed } = await guardAdmin("customers.read"); return allowed ? <CustomersList /> : <NoAccess />; }
