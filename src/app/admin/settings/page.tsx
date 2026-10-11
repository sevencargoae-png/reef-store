import { guardAdmin } from "@/lib/admin/guard"; import { NoAccess } from "@/components/admin/no-access"; import { SettingsAdmin } from "@/components/admin/misc-pages"; import { getSettings } from "@/lib/settings";
export default async function Page() { const { allowed } = await guardAdmin("settings.write"); return allowed ? <SettingsAdmin initial={await getSettings()} /> : <NoAccess />; }
