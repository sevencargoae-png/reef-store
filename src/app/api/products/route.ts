import { handler, ok } from "@/lib/api";
import { listProducts, type SortKey } from "@/lib/services/catalog";

export const GET = handler(async (req) => {
  const u = new URL(req.url);
  const g = (k: string) => u.searchParams.get(k) ?? undefined;
  return ok(await listProducts({
    q: g("q"), category: g("category"), offers: g("offers") === "1", inStock: g("inStock") === "1",
    sort: g("sort") as SortKey | undefined, page: Number(g("page") ?? 1), pageSize: Number(g("pageSize") ?? 24),
  }));
});
