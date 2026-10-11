import { requireUser } from "@/lib/auth/session";
import { ProfileView } from "@/components/store/account-views";
export default async function AccountPage() { const u = await requireUser(); return <ProfileView user={u} />; }
