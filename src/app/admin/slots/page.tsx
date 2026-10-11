import { guardAdmin } from "@/lib/admin/guard"; import { NoAccess } from "@/components/admin/no-access"; import { SlotsPage } from "@/components/admin/simple-pages";
export default async function Page() { const { allowed } = await guardAdmin("delivery.write"); return allowed ? <SlotsPage canWrite /> : <NoAccess />; }
