import { guardAdmin } from "@/lib/admin/guard"; import { NoAccess } from "@/components/admin/no-access"; import { AuditAdmin } from "@/components/admin/misc-pages";
export default async function Page() { const { allowed } = await guardAdmin("audit.read"); return allowed ? <AuditAdmin /> : <NoAccess />; }
