"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

export function StaffLogin() {
  const { t } = useI18n();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div className="mx-auto mt-20 w-full max-w-sm rounded-3xl bg-white p-8 shadow-card">
      <div className="mb-5 flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-reef-700" /><div><h1 className="text-xl font-extrabold text-reef-800">{t("admin.login")}</h1><p className="text-xs text-muted">{t("admin.login.sub")}</p></div></div>
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setPending(true); setErr(null); const fd = new FormData(e.currentTarget); try { await api("/api/admin/auth/login", { method: "POST", json: { phone: fd.get("phone"), password: fd.get("password") } }); router.push("/admin"); router.refresh(); } catch { setErr(t("error.INVALID_CREDENTIALS")); setPending(false); } }}>
        <Field label={t("auth.phone")} required>{(p) => <Input {...p} name="phone" type="tel" dir="ltr" autoComplete="username" required />}</Field>
        <Field label={t("f.password")} required>{(p) => <Input {...p} name="password" type="password" autoComplete="current-password" required />}</Field>
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-berry">{err}</p>}
        <Button type="submit" className="w-full" loading={pending}>{t("auth.enter")}</Button>
      </form>
    </div>
  );
}
