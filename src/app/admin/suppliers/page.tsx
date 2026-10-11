import { guardAdmin } from "@/lib/admin/guard"; import { NoAccess } from "@/components/admin/no-access"; import { SuppliersPage } from "@/components/admin/simple-pages"; import { can } from "@/lib/rbac";
export default async function Page() { const { allowed, user } = await guardAdmin("catalog.read"); return allowed ? <SuppliersPage canWrite={can(user.role, "catalog.write")} /> : <NoAccess />; }
