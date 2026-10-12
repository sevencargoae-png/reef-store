"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart3, Boxes, ClipboardList, Cog, FileClock, LayoutDashboard, LogOut, MapPinned, Menu, MessageSquare, MoreHorizontal, Package, Repeat, ScanLine, Store, Tags, Ticket, Truck, Users, UserCog, X } from "lucide-react";
import { InstallButton } from "@/components/store/pwa";
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
  { href: "/admin/complaints", key: "admin.complaints" as MessageKey, icon: MessageSquare, perm: "customers.read" },
  { href: "/admin/scan", key: "admin.scan" as MessageKey, icon: ScanLine, perm: "orders.read" },
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
      <header className="glass sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-reef-100 px-3 md:px-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <button type="button" className="hidden rounded-lg p-2 hover:bg-mint-100 md:inline-flex lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="menu">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        <Link href="/admin" className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-base font-extrabold text-reef-700 md:text-lg"><span dir="ltr">Reeef</span><span className="truncate text-sm font-bold text-muted md:text-base">· {t("admin.title")}</span></Link>
        <div className="ms-auto flex items-center gap-1 text-sm md:gap-2">
          <span className="hidden text-muted md:inline">{user.name} · {t(`role.${user.role}` as MessageKey)}</span>
          <div className="hidden sm:flex sm:items-center sm:gap-1"><InstallButton /><LangToggle /></div>
          <Link href="/" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold hover:bg-mint-100"><Store className="h-4 w-4" /><span className="hidden sm:inline">{t("admin.backToStore")}</span></Link>
          <button type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/admin/login"); router.refresh(); }} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold text-berry hover:bg-red-50"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">{t("nav.logout")}</span></button>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-e border-reef-100 bg-white lg:block">{nav}</aside>
        {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)}><aside className="fade-up h-full w-72 overflow-y-auto bg-white pt-4 shadow-soft" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }} onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between px-4 pb-2"><span className="font-extrabold text-reef-800">{user.name}</span><button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-mint-100" aria-label="close"><X className="h-5 w-5" /></button></div>{nav}<div className="flex flex-wrap gap-2 p-4"><LangToggle /><InstallButton /></div></aside></div>}
        <main className="min-w-0 flex-1 p-3 pb-24 md:p-6 lg:pb-6">{children}</main>
      </div>
      {/* app-style tab bar on phones */}
      <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-reef-100 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="admin">
        <div className="grid grid-cols-5">
          {items.slice(0, 4).map((n) => {
            const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
            return <Link key={n.href} href={n.href} className={cx("relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold active:scale-95", active ? "text-reef-700" : "text-muted")}>{active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-reef-600" aria-hidden />}<n.icon className="h-5 w-5" aria-hidden />{t(n.key)}</Link>;
          })}
          <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted active:scale-95"><MoreHorizontal className="h-5 w-5" aria-hidden />{t("admin.more")}</button>
        </div>
      </nav>
    </div>
  );
}
