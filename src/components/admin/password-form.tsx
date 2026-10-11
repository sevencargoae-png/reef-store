"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { api, ApiError } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import type { MessageKey } from "@/lib/i18n/messages";

export function PasswordForm({ forced }: { forced: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl bg-white p-6 shadow-card">
      <h1 className="text-xl font-extrabold text-reef-800">{t("account.changePassword")}</h1>
      {forced && <p className="mt-2 rounded-xl bg-sun/15 px-3 py-2 text-sm">{t("admin.mustChangePassword")}</p>}
      <form className="mt-4 space-y-4" onSubmit={async (e) => { e.preventDefault(); setPending(true); setErr(null); const fd = new FormData(e.currentTarget); try { await api("/api/auth/password", { method: "POST", json: { current: fd.get("current"), next: fd.get("next") } }); router.push("/admin"); router.refresh(); } catch (ex) { setErr(ex instanceof ApiError ? t(`error.${ex.code}` as MessageKey) : t("common.error")); setPending(false); } }}>
        <Field label={t("account.currentPassword")} required>{(p) => <Input {...p} name="current" type="password" required />}</Field>
        <Field label={t("account.newPassword")} hint={t("auth.passwordMin")} required>{(p) => <Input {...p} name="next" type="password" required minLength={8} />}</Field>
        {err && <p className="text-sm text-berry">{err}</p>}
        <Button type="submit" loading={pending}>{t("common.save")}</Button>
      </form>
    </div>
  );
}
