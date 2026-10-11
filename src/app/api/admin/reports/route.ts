import { handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";
import { salesReport } from "@/lib/admin/reports";
import { addDays, uaeToday } from "@/lib/services/delivery";
export const GET = handler(async (req) => {
  await requireStaff("reports.read");
  const sp = new URL(req.url).searchParams;
  const to = sp.get("to") || uaeToday(); const from = sp.get("from") || addDays(to, -29);
  const r = await salesReport(from, to);
  if (sp.get("format") === "csv") {
    const rows = [["day", "orders", "revenue_aed", "cogs_aed", "profit_aed"], ...r.byDay.map((d) => [d.day, d.orders, (d.revenue / 100).toFixed(2), (d.cogs / 100).toFixed(2), ((d.revenue - d.cogs) / 100).toFixed(2)])];
    return new Response("﻿" + rows.map((x) => x.join(",")).join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="reef-sales-${from}-${to}.csv"` } });
  }
  return ok(r);
});
