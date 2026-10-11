"use client";
import { useI18n } from "@/lib/i18n/provider";
export function NoAccess() { const { t } = useI18n(); return <div className="rounded-2xl bg-white p-10 text-center text-muted shadow-card">{t("admin.noAccess")}</div>; }
