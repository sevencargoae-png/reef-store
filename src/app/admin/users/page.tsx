import { guardAdmin } from "@/lib/admin/guard"; import { NoAccess } from "@/components/admin/no-access"; import { UsersAdmin } from "@/components/admin/misc-pages";
export default async function Page() { const { allowed, user } = await guardAdmin("users.write"); return allowed ? <UsersAdmin meId={user.id} /> : <NoAccess />; }
