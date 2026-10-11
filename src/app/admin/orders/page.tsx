import { Suspense } from "react";
import { guardAdmin } from "@/lib/admin/guard";
import { NoAccess } from "@/components/admin/no-access";
import { OrdersList } from "@/components/admin/orders-view";
export default async function Page() { const { allowed } = await guardAdmin("orders.read"); return allowed ? <Suspense><OrdersList /></Suspense> : <NoAccess />; }
