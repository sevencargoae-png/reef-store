import { handler, ok } from "@/lib/api";
import { listCategories } from "@/lib/services/catalog";
export const GET = handler(async () => ok(await listCategories()));
