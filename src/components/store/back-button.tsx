"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

const KEY = "reeef.pages";
const read = () => { try { return Number(sessionStorage.getItem(KEY) || 0); } catch { return 0; } };

/** Floating back button on every store page except the home page. Goes home when the page was opened directly. */
export function BackButton() {
  const path = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  useEffect(() => { try { sessionStorage.setItem(KEY, String(read() + 1)); } catch { /* storage blocked */ } }, [path]);
  if (path === "/") return null;
  const goBack = () => (read() > 1 ? router.back() : router.push("/"));
  return (
    <button type="button" onClick={goBack} className="back-fab" aria-label={t("nav.back")}>
      <ArrowRight className="h-5 w-5 ltr:rotate-180" aria-hidden />
      <span>{t("nav.back")}</span>
    </button>
  );
}
