import { guardAdmin } from "@/lib/admin/guard"; import { NoAccess } from "@/components/admin/no-access"; import { CouponsPage } from "@/components/admin/simple-pages";
export default async function Page() { const { allowed } = await guardAdmin("promotions.write"); return allowed ? <CouponsPage canWrite /> : <NoAccess />; }
