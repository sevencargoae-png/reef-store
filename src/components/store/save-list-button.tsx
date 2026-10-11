"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { api } from "@/lib/client-api";
import { useCart } from "./cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

export function SaveListButton() {
  const { t } = useI18n();
  const { cart } = useCart();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  if (!open) return <Button variant="outline" size="sm" onClick={() => setOpen(true)}>{t("cart.saveAsList")}</Button>;
  return (
    <form className="flex items-center gap-2" onSubmit={async (e) => {
      e.preventDefault(); setPending(true);
      try { await api("/api/account/lists", { method: "POST", json: { name: name || t("lists.weekly"), items: cart.items.map((l) => ({ productId: l.product.id, qty: l.qty })) } }); toast.success(t("account.saved")); setOpen(false); }
      catch { toast.error(t("common.error")); } finally { setPending(false); }
    }}>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("lists.name")} className="!h-9 !w-44 !py-1" />
      <Button size="sm" type="submit" loading={pending}>{t("lists.save")}</Button>
      <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
    </form>
  );
}
