"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { Logo } from "./header";

export function Footer({ supportPhone }: { supportPhone: string }) {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-reef-100 bg-white pb-20 md:pb-8">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div><Logo /><p className="mt-3 max-w-sm text-sm leading-6 text-muted">{t("footer.about")}</p></div>
        <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
          <Link href="/categories" className="hover:text-reef-700">{t("nav.categories")}</Link>
          <Link href="/offers" className="hover:text-reef-700">{t("nav.offers")}</Link>
          <Link href="/about" className="hover:text-reef-700">{t("nav.about")}</Link>
          <Link href="/account/orders" className="hover:text-reef-700">{t("nav.orders")}</Link>
          <Link href="/account/lists" className="hover:text-reef-700">{t("nav.lists")}</Link>
          <Link href="/account/subscriptions" className="hover:text-reef-700">{t("nav.subscriptions")}</Link>
          <Link href="/privacy" className="hover:text-reef-700">{t("nav.privacy")}</Link>
          <Link href="/terms" className="hover:text-reef-700">{t("nav.terms")}</Link>
        </div>
        <div className="text-sm">
          <div className="font-semibold">{t("footer.support")}</div>
          {supportPhone ? <a href={`tel:${supportPhone}`} className="num mt-1 block text-reef-700">{supportPhone}</a> : null}
          <p className="mt-4 text-xs text-muted">© {new Date().getFullYear()} Reeef | ريف — {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
