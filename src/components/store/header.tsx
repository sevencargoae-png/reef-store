"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Home, LayoutGrid, Menu, Search, ShoppingCart, Tag, User, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useCart } from "./cart-provider";
import { cx } from "@/components/ui/cx";
import type { AuthUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/rbac";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cx("flex items-center gap-2 text-reef-700", className)} aria-label="Reef | ريف">
      <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden><rect width="64" height="64" rx="16" fill="#1c7a47" /><path d="M18 44c0-14 10-24 28-26-1 18-11 28-26 28h-2z" fill="#b9e3c8" /><path d="M20 44c6-10 12-16 22-22" stroke="#1c7a47" strokeWidth="3" strokeLinecap="round" fill="none" /></svg>
      <span className="text-2xl font-extrabold tracking-tight"><span dir="ltr">Reef</span> <span className="font-bold text-reef-300">|</span> ريف</span>
    </Link>
  );
}

export function LangToggle({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  return (
    <button type="button" className={cx("rounded-full px-3 py-1.5 text-sm font-semibold text-reef-800 hover:bg-mint-100", className)}
      onClick={async () => { await fetch("/api/locale", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: locale === "ar" ? "en" : "ar" }) }); router.refresh(); }}>
      {t("nav.lang")}
    </button>
  );
}

function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form role="search" className={cx("relative", className)} onSubmit={(e) => { e.preventDefault(); router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products"); }}>
      <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-reef-600" aria-hidden />
      <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus={autoFocus} placeholder={t("nav.search")} aria-label={t("common.search")}
        className="h-11 w-full rounded-full border border-reef-100 bg-mint-50/70 ps-11 pe-4 text-sm outline-none transition focus:border-reef-300 focus:bg-white focus:ring-2 focus:ring-reef-100" />
    </form>
  );
}

const NAV = [
  { href: "/", key: "nav.home", icon: Home },
  { href: "/categories", key: "nav.categories", icon: LayoutGrid },
  { href: "/offers", key: "nav.offers", icon: Tag },
  { href: "/about", key: "nav.about", icon: null },
] as const;

export function Header({ user }: { user: AuthUser | null }) {
  const { t } = useI18n();
  const path = usePathname();
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const count = cart.items.length;

  return (
    <header className="glass sticky top-0 z-40 border-b border-reef-100/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-6">
        <Logo />
        <SearchBox className="hidden flex-1 md:block md:max-w-md" />
        <nav className="ms-auto hidden items-center gap-1 md:flex" aria-label="main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cx("rounded-full px-3 py-1.5 text-sm font-semibold transition hover:bg-mint-100", path === n.href ? "text-reef-700 underline decoration-2 underline-offset-8" : "text-ink")}>{t(n.key)}</Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <LangToggle className="hidden md:inline-flex" />
          <Link href="/account/wishlist" className="hidden rounded-full p-2 text-reef-800 hover:bg-mint-100 md:inline-flex" aria-label={t("nav.wishlist")}><Heart className="h-5 w-5" /></Link>
          <Link href={user ? "/account" : "/login"} className="hidden rounded-full p-2 text-reef-800 hover:bg-mint-100 md:inline-flex" aria-label={t("nav.account")}><User className="h-5 w-5" /></Link>
          <Link href="/cart" className="relative rounded-full p-2 text-reef-800 hover:bg-mint-100" aria-label={t("nav.cart")}>
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && <span className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-reef-600 px-1 text-[11px] font-bold text-white num">{count}</span>}
          </Link>
          <button type="button" className="rounded-full p-2 text-reef-800 hover:bg-mint-100 md:hidden" aria-label="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden"><SearchBox /></div>
      {open && (
        <div className="fade-up border-t border-reef-100 bg-white px-4 py-3 md:hidden">
          <div className="grid gap-1">
            {NAV.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-mint-50">{t(n.key)}</Link>)}
            <Link href="/account/wishlist" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-mint-50">{t("nav.wishlist")}</Link>
            {user ? (<>
              <Link href="/account" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-mint-50">{t("nav.account")}</Link>
              {isStaff(user.role) && <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold text-reef-700 hover:bg-mint-50">{t("nav.admin")}</Link>}
            </>) : (
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-mint-50">{t("nav.login")}</Link>
            )}
            <LangToggle className="self-start" />
          </div>
        </div>
      )}
    </header>
  );
}

export function BottomNav({ user }: { user: AuthUser | null }) {
  const { t } = useI18n();
  const path = usePathname();
  const items = [
    { href: "/", key: "nav.home" as const, icon: Home },
    { href: "/categories", key: "nav.categories" as const, icon: LayoutGrid },
    { href: "/offers", key: "nav.offers" as const, icon: Tag },
    { href: user ? "/account" : "/login", key: "nav.account" as const, icon: User },
  ];
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-reef-100 md:hidden" aria-label="mobile" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid grid-cols-4">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <Link key={it.key} href={it.href} className={cx("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", active ? "text-reef-700" : "text-muted")}>
              <it.icon className="h-5 w-5" aria-hidden />{t(it.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
