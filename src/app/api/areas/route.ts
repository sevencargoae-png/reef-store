import { handler, ok } from "@/lib/api";
import { listAreas, listEmirates } from "@/lib/services/delivery";
export const GET = handler(async () => ok({ emirates: await listEmirates(), areas: await listAreas() }));
