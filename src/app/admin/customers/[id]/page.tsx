import { guardAdmin } from "@/lib/admin/guard";
import { NoAccess } from "@/components/admin/no-access";
import { CustomerDetail } from "@/components/admin/customers-view";
import { can } from "@/lib/rbac";
export default async function Page({ params }: PageProps<"/admin/customers/[id]">) {
  const { allowed, user } = await guardAdmin("customers.read"); const { id } = await params;
  return allowed ? <CustomerDetail id={id} canWrite={can(user.role, "customers.write")} /> : <NoAccess />;
}
