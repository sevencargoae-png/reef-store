"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, ListChecks, LogOut, MapPin, Package, Repeat, ShieldCheck, User } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/components/ui/cx";
import { isStaff } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/enums";

export function AccountNav({ user }: { user: { name: string; phone: string; role: Role } }) {
  const { t } = useI18n();
  const path = usePathname();
  const router = useRouter();
  const items = [
    { href: "/account", icon: User, label: t("account.profile") },
    { href: "/account/orders", icon: Package, label: t("orders.title") },
    { href: "/account/addresses", icon: MapPin, label: t("address.title") },
    { href: "/account/lists", icon: ListChecks, label: t("lists.title") },
    { href: "/account/subscriptions", icon: Repeat, label: t("subs.title") },
    { href: "/account/wishlist", icon: Heart, label: t("account.wishlist") },
  ];
  return (
    <aside className="rounded-2xl bg-white p-3 shadow-card md:sticky md:top-20 md:h-fit">
      <div className="px-2 pb-3"><div className="font-extrabold">{user.name}</div><div className="num text-xs text-muted">{user.phone}</div></div>
      <nav className="hide-scrollbar flex gap-1 overflow-x-auto md:flex-col">
        {items.map((it) => { const active = it.href === "/account" ? path === "/account" : path.startsWith(it.href); return <Link key={it.href} href={it.href} className={cx("flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold", active ? "bg-mint-100 text-reef-800" : "hover:bg-mint-50")}><it.icon className="h-4 w-4" />{it.label}</Link>; })}
        {isStaff(user.role) && <Link href="/admin" className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-reef-700 hover:bg-mint-50"><ShieldCheck className="h-4 w-4" />{t("nav.admin")}</Link>}
        <button type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-berry hover:bg-red-50"><LogOut className="h-4 w-4" />{t("nav.logout")}</button>
      </nav>
    </aside>
  );
}
