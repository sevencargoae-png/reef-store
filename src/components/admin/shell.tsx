"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart3, Boxes, ClipboardList, Cog, FileClock, LayoutDashboard, LogOut, MapPinned, Menu, Package, Repeat, Store, Tags, Ticket, Truck, Users, UserCog, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { can, type Permission } from "@/lib/rbac";
import type { AuthUser } from "@/lib/auth/session";
import { cx } from "@/components/ui/cx";
import { LangToggle } from "@/components/store/header";
import type { MessageKey } from "@/lib/i18n/messages";

export const ADMIN_NAV: { href: string; key: MessageKey; icon: typeof Package; perm: Permission }[] = [
  { href: "/admin", key: "admin.dashboard", icon: LayoutDashboard, perm: "orders.read" },
  { href: "/admin/orders", key: "admin.orders", icon: ClipboardList, perm: "orders.read" },
  { href: "/admin/products", key: "admin.products", icon: Package, perm: "catalog.read" },
  { href: "/admin/categories", key: "admin.categories", icon: Tags, perm: "catalog.read" },
  { href: "/admin/suppliers", key: "admin.suppliers", icon: Boxes, perm: "catalog.read" },
  { href: "/admin/customers", key: "admin.customers", icon: Users, perm: "customers.read" },
  { href: "/admin/areas", key: "admin.areas", icon: MapPinned, perm: "delivery.write" },
  { href: "/admin/slots", key: "admin.slots", icon: Truck, perm: "delivery.write" },
  { href: "/admin/coupons", key: "admin.coupons", icon: Ticket, perm: "promotions.write" },
  { href: "/admin/subscriptions", key: "admin.subscriptions", icon: Repeat, perm: "subscriptions.read" },
  { href: "/admin/reports", key: "admin.reports", icon: BarChart3, perm: "reports.read" },
  { href: "/admin/users", key: "admin.users", icon: UserCog, perm: "users.write" },
  { href: "/admin/audit", key: "admin.audit", icon: FileClock, perm: "audit.read" },
  { href: "/admin/settings", key: "admin.settings", icon: Cog, perm: "settings.write" },
];

export function AdminShell({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const { t } = useI18n();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = ADMIN_NAV.filter((n) => can(user.role, n.perm));
  const nav = (
    <nav className="flex flex-col gap-0.5 p-2">
      {items.map((n) => { const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href); return <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cx("flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition", active ? "bg-reef-600 text-white" : "text-reef-900 hover:bg-mint-100")}><n.icon className="h-4 w-4" />{t(n.key)}</Link>; })}
    </nav>
  );
  return (
    <div className="min-h-dvh bg-mint-50/60">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-reef-100 bg-white px-4">
        <button type="button" className="rounded-lg p-2 hover:bg-mint-100 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="menu">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        <Link href="/admin" className="text-lg font-extrabold text-reef-700"><span dir="ltr">Reef</span> · {t("admin.title")}</Link>
        <div className="ms-auto flex items-center gap-2 text-sm">
          <span className="hidden text-muted md:inline">{user.name} · {t(`role.${user.role}` as MessageKey)}</span>
          <LangToggle />
          <Link href="/" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold hover:bg-mint-100"><Store className="h-4 w-4" /><span className="hidden sm:inline">{t("admin.backToStore")}</span></Link>
          <button type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/admin/login"); router.refresh(); }} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold text-berry hover:bg-red-50"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">{t("nav.logout")}</span></button>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-e border-reef-100 bg-white lg:block">{nav}</aside>
        {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-64 bg-white pt-14" onClick={(e) => e.stopPropagation()}>{nav}</aside></div>}
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
