import { handler, ok } from "@/lib/api";
import { availableSlots } from "@/lib/services/delivery";
import { getSettings } from "@/lib/settings";
export const GET = handler(async () => ok(await availableSlots((await getSettings()).bookingWindowDays)));
