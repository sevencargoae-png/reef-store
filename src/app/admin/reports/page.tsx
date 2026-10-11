import { guardAdmin } from "@/lib/admin/guard"; import { NoAccess } from "@/components/admin/no-access"; import { ReportsAdmin } from "@/components/admin/misc-pages";
export default async function Page() { const { allowed } = await guardAdmin("reports.read"); return allowed ? <ReportsAdmin /> : <NoAccess />; }
