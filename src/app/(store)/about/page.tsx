import { getT } from "@/lib/i18n/server";
import { Features } from "@/components/store/home";
import { getSettings } from "@/lib/settings";

export default async function AboutPage() {
  const { t, locale } = await getT();
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold text-reef-800">{t("about.title")}</h1>
      <p className="mt-4 text-lg leading-8 text-ink">{t("about.body")}</p>
      <Features promise={locale === "ar" ? s.deliveryPromiseAr : s.deliveryPromiseEn} />
    </div>
  );
}
