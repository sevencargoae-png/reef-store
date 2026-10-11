import { guardAdmin } from "@/lib/admin/guard";
import { Dashboard } from "@/components/admin/dashboard";
export default async function Page() { await guardAdmin("orders.read"); return <Dashboard />; }
