import { getT } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "الشروط والأحكام | Terms & Conditions" };

export default async function TermsPage() {
  const { t } = await getT();
  const sections = [
    { title: t("terms.service.title"), body: t("terms.service.body") },
    { title: t("terms.orders.title"), body: t("terms.orders.body") },
    { title: t("terms.payment.title"), body: t("terms.payment.body") },
    { title: t("terms.cancel.title"), body: t("terms.cancel.body") },
    { title: t("terms.changes.title"), body: t("terms.changes.body") },
  ];
  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold text-reef-800">{t("terms.title")}</h1>
      <p className="mt-4 text-lg leading-8 text-ink">{t("terms.intro")}</p>
      {sections.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="text-xl font-bold text-reef-700">{s.title}</h2>
          <p className="mt-2 leading-7 text-ink">{s.body}</p>
        </section>
      ))}
    </div>
  );
}
