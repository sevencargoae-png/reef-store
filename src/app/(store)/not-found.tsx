import Link from "next/link";
import { getT } from "@/lib/i18n/server";
export default async function NotFound() {
  const { t } = await getT();
  return <div className="py-24 text-center"><h1 className="text-3xl font-extrabold text-reef-800">404</h1><p className="mt-2 text-muted">{t("error.NOT_FOUND")}</p><Link href="/" className="mt-6 inline-block font-semibold text-reef-700 underline">{t("nav.home")}</Link></div>;
}
