"use client";
import { Heart } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { cx } from "@/components/ui/cx";

const Ctx = createContext<{ ids: Set<string>; toggle: (id: string) => Promise<void>; loggedIn: boolean } | null>(null);

export function WishlistProvider({ loggedIn, children }: { loggedIn: boolean; children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  useEffect(() => { if (loggedIn) api<{ productId: string }[]>("/api/account/wishlist").then((r) => setIds(new Set(r.map((x) => x.productId)))).catch(() => {}); }, [loggedIn]);
  const toggle = useCallback(async (id: string) => {
    if (!loggedIn) { router.push("/login"); return; }
    const r = await api<{ productId: string }[]>("/api/account/wishlist", { method: "POST", json: { productId: id } });
    setIds(new Set(r.map((x) => x.productId)));
  }, [loggedIn, router]);
  const v = useMemo(() => ({ ids, toggle, loggedIn }), [ids, toggle, loggedIn]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function WishButton({ productId, className }: { productId: string; className?: string }) {
  const c = useContext(Ctx);
  const on = c?.ids.has(productId) ?? false;
  return (
    <button type="button" aria-pressed={on} aria-label="wishlist" onClick={() => c?.toggle(productId)}
      className={cx("flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-110", className)}>
      <Heart className={cx("h-4 w-4", on ? "fill-berry text-berry" : "text-reef-800")} />
    </button>
  );
}
