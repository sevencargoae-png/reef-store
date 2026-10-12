"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Heart, Home, LayoutGrid, MapPin, Menu, Search, ShoppingCart, Tag, User, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useCart } from "./cart-provider";
import { cx } from "@/components/ui/cx";
import type { AuthUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/rbac";
import type { MessageKey } from "@/lib/i18n/messages";
import { InstallButton } from "./pwa";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cx("flex shrink-0 items-center gap-2 text-reef-700", className)} aria-label="Reeef | ريف">
      <svg viewBox="0 0 64 64" className={compact ? "h-8 w-8" : "h-9 w-9"} aria-hidden>
        <defs><linearGradient id="lg-leaf" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#0f5a37" /><stop offset="1" stopColor="#3fa45f" /></linearGradient></defs>
        <path d="M30 56C14 50 8 32 15 12c12 6 19 18 16 40" fill="url(#lg-leaf)" />
        <path d="M34 56c16-6 22-24 15-44-12 6-19 18-16 40" fill="#7cc36a" />
        <path d="M32 55V28" stroke="#fff" strokeOpacity=".6" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className={cx("font-extrabold tracking-tight", compact ? "text-xl" : "text-2xl")}><span dir="ltr">Reeef</span> <span className="font-bold text-reef-300">|</span> ريف</span>
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

function SearchBox({ className }: { className?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form role="search" className={cx("relative", className)} onSubmit={(e) => { e.preventDefault(); router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products"); }}>
      <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-reef-600" aria-hidden />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("nav.search")} aria-label={t("common.search")} enterKeyHint="search"
        className="h-11 w-full rounded-full border border-reef-100 bg-white/90 ps-11 pe-4 text-sm shadow-sm outline-none transition focus:border-reef-300 focus:ring-2 focus:ring-reef-100" />
    </form>
  );
}

function DeliverTo({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <Link href="/account/addresses" className={cx("inline-flex shrink-0 items-center gap-1.5 rounded-full border border-reef-100 bg-white/80 font-semibold text-reef-800 transition hover:bg-mint-50", compact ? "h-8 px-2.5 text-xs" : "h-10 px-3.5 text-sm")}>
      <MapPin className="h-4 w-4 text-reef-600" aria-hidden />
      {!compact && <span className="text-muted">{t("nav.deliverTo")}</span>}<span>{t("nav.uae")}</span>
    </Link>
  );
}

const CAT_BAR: { href: string; key: MessageKey }[] = [
  { href: "/offers", key: "nav.specialOffers" },
  { href: "/products?sort=featured", key: "nav.seasonal" },
  { href: "/categories/vegetables", key: "nav.vegetables" },
  { href: "/categories/fruits", key: "nav.fruits" },
  { href: "/categories/herbs", key: "nav.herbs" },
  { href: "/products?q=%D8%B9%D8%B6%D9%88%D9%8A", key: "nav.organic" },
];

export function Header({ user }: { user: AuthUser | null }) {
  const { t } = useI18n();
  const path = usePathname();
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const count = cart.items.length;

  return (
    <header className="glass sticky top-0 z-40 border-b border-reef-100/70" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 md:h-16 md:gap-4">
        <Logo className="md:hidden" compact />
        <Logo className="hidden md:flex" />
        <div className="hidden md:block"><DeliverTo /></div>
        <SearchBox className="hidden flex-1 md:block md:max-w-xl" />
        <div className="ms-auto flex items-center gap-1">
          <div className="md:hidden"><DeliverTo compact /></div>
          <div className="hidden md:block"><InstallButton /></div>
          <LangToggle className="hidden md:inline-flex" />
          <Link href={user ? "/account" : "/login"} className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-reef-800 hover:bg-mint-100 md:inline-flex"><User className="h-5 w-5" />{t("nav.account")}</Link>
          <Link href="/cart" className="relative rounded-full p-2 text-reef-800 hover:bg-mint-100" aria-label={t("nav.cart")}>
            <ShoppingCart className="h-6 w-6" />
            {count > 0 && <span className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry px-1 text-[11px] font-bold text-white num">{count}</span>}
          </Link>
          <button type="button" className="rounded-full p-2 text-reef-800 hover:bg-mint-100 md:hidden" aria-label="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      <div className="px-4 pb-2 md:hidden"><SearchBox /></div>
      {/* category bar: a pill row on phones, a full bar on desktop */}
      <nav className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 pb-2.5 hide-scrollbar md:pb-3" aria-label="categories">
        <Link href="/products" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-reef-700 px-3.5 text-sm font-bold text-white shadow-soft md:h-10 md:px-4">
          <Menu className="h-4 w-4" aria-hidden />{t("nav.allProducts")}<ChevronDown className="hidden h-4 w-4 md:block" aria-hidden />
        </Link>
        {CAT_BAR.map((c) => {
          const active = path === c.href.split("?")[0] && c.href.startsWith("/categories");
          return <Link key={c.href} href={c.href} className={cx("inline-flex h-9 shrink-0 items-center rounded-xl px-3 text-sm font-semibold transition md:h-10 md:px-4", active ? "bg-mint-100 text-reef-700" : "text-ink hover:bg-white/80")}>{t(c.key)}</Link>;
        })}
      </nav>
      {open && (
        <div className="fade-up border-t border-reef-100 bg-white px-4 py-3 md:hidden">
          <div className="grid gap-1">
            <Link href="/categories" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-mint-50">{t("nav.categories")}</Link>
            <Link href="/about" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-mint-50">{t("nav.about")}</Link>
            {user ? (<>
              <Link href="/account" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-mint-50">{t("nav.account")}</Link>
              {isStaff(user.role) && <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold text-reef-700 hover:bg-mint-50">{t("nav.admin")}</Link>}
            </>) : (
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-mint-50">{t("nav.login")}</Link>
            )}
            <InstallButton className="justify-start" />
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
    { href: "/account/wishlist", key: "nav.wishlist" as const, icon: Heart },
    { href: user ? "/account" : "/login", key: "nav.account" as const, icon: User },
  ];
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-reef-100 md:hidden" aria-label="mobile" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <Link key={it.key} href={it.href} className={cx("relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition active:scale-95", active ? "text-reef-700" : "text-muted")}>
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-reef-600" aria-hidden />}
              <it.icon className="h-5 w-5" aria-hidden strokeWidth={active ? 2.4 : 1.8} />{t(it.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
