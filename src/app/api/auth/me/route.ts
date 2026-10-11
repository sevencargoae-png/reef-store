import { handler, ok } from "@/lib/api";
import { currentUser } from "@/lib/auth/session";
export const GET = handler(async () => ok(await currentUser()));
