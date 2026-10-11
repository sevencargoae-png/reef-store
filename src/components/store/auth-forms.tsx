"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { api, ApiError } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import type { MessageKey } from "@/lib/i18n/messages";

function useNext() { const sp = useSearchParams(); const n = sp.get("next"); return n && n.startsWith("/") ? n : "/"; }

/** Customer sign-in by mobile number: existing numbers enter immediately; new numbers add a name once. */
export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const next = useNext();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true); setErr(null);
    try {
      const r = await api<{ isNew: boolean }>("/api/auth/phone-login", { method: "POST", json: { phone, name: isNew ? name : undefined } });
      if (r.isNew) { setIsNew(true); setPending(false); return; }
      router.push(next); router.refresh();
    } catch (e) { setErr(e instanceof ApiError ? t(`error.${e.code}` as MessageKey) : t("common.error")); setPending(false); }
  }

  return (
    <div className="mx-auto my-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-card md:p-8">
      <div className="mb-5 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-100 text-reef-700"><Smartphone className="h-6 w-6" /></span><div><h1 className="text-2xl font-extrabold text-reef-800">{t("auth.login")}</h1><p className="text-sm text-muted">{t("auth.loginSub")}</p></div></div>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <Field label={t("auth.phone")} hint={t("auth.phoneHint")} required>{(p) => <Input {...p} value={phone} onChange={(e) => { setPhone(e.target.value); setIsNew(false); }} type="tel" inputMode="tel" dir="ltr" autoComplete="tel" autoFocus required className="text-lg tracking-wider" />}</Field>
        {isNew && (
          <div className="fade-up space-y-3">
            <p className="rounded-xl bg-mint-50 px-3 py-2 text-sm text-reef-800">{t("auth.welcomeNew")}</p>
            <Field label={t("auth.newUserName")} required>{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus required minLength={2} />}</Field>
          </div>
        )}
        {err && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-berry">{err}</p>}
        <Button type="submit" loading={pending} className="w-full" size="lg">{t("auth.enter")}</Button>
      </form>
    </div>
  );
}
