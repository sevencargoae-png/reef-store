import { getT } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "سياسة الخصوصية | Privacy Policy" };

export default async function PrivacyPage() {
  const { t } = await getT();
  const sections = [
    { title: t("privacy.collect.title"), body: t("privacy.collect.body") },
    { title: t("privacy.use.title"), body: t("privacy.use.body") },
    { title: t("privacy.protect.title"), body: t("privacy.protect.body") },
    { title: t("privacy.rights.title"), body: t("privacy.rights.body") },
    { title: t("privacy.contact.title"), body: t("privacy.contact.body") },
  ];
  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold text-reef-800">{t("privacy.title")}</h1>
      <p className="mt-4 text-lg leading-8 text-ink">{t("privacy.intro")}</p>
      {sections.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="text-xl font-bold text-reef-700">{s.title}</h2>
          <p className="mt-2 leading-7 text-ink">{s.body}</p>
        </section>
      ))}
    </div>
  );
}
