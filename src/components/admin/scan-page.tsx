"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { PageHeader } from "./ui";
import type { MessageKey } from "@/lib/i18n/messages";

export function ScanPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const lookup = async () => {
    if (!value.trim()) return;
    setPending(true); setError(null);
    try {
      const res = await api<{ items: { id: string }[] }>(`/api/admin/orders?q=${encodeURIComponent(value.trim())}&pageSize=1`);
      if (res.items.length > 0) {
        router.push(`/admin/orders/${res.items[0].id}`);
      } else {
        setError(t("scan.notFound" as MessageKey));
      }
    } catch {
      setError(t("scan.notFound" as MessageKey));
    } finally { setPending(false); }
  };

  return (
    <div>
      <PageHeader title={t("admin.scan" as MessageKey)} />
      <div className="mx-auto max-w-md space-y-4 pt-8">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); lookup(); }}>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("scan.placeholder" as MessageKey)}
            autoFocus
            className="flex-1"
          />
          <Button type="submit" loading={pending}>{t("common.search")}</Button>
        </form>
        {error && <p className="text-center text-sm text-berry">{error}</p>}
      </div>
    </div>
  );
}
