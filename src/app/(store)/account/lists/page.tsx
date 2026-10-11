import { requireUser } from "@/lib/auth/session";
import { myLists } from "@/lib/services/lists";
import { ListsView } from "@/components/store/account-views";
export default async function ListsPage() { const u = await requireUser(); return <ListsView lists={await myLists(u.id)} />; }
