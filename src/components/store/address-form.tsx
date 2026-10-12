"use client";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { api, fieldErrors } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import type { AreaDTO } from "@/lib/services/delivery";
import type { MessageKey } from "@/lib/i18n/messages";

export interface Geo { emirates: { id: string; code: string; nameAr: string; nameEn: string; active: boolean }[]; areas: AreaDTO[] }
export interface AddressRow { id: string; label: string; emirateId: string; areaId: string; street: string; building: string; unit: string | null; notes: string | null; isDefault: boolean; area?: { nameAr: string; nameEn: string }; emirate?: { nameAr: string; nameEn: string } }

export function AddressForm({ geo, initial, onSaved, onCancel }: { geo: Geo; initial?: AddressRow | null; onSaved: (a: AddressRow) => void; onCancel?: () => void }) {
  const { t, locale } = useI18n();
  const N = (o: { nameAr: string; nameEn: string }) => (locale === "ar" ? o.nameAr : o.nameEn);
  const [emirateId, setEmirateId] = useState(initial?.emirateId ?? geo.emirates[0]?.id ?? "");
  const emirateBlocked = useMemo(() => { const em = geo.emirates.find((e) => e.id === emirateId); return em ? !em.active : false; }, [geo.emirates, emirateId]);
  const areas = useMemo(() => geo.areas.filter((a) => a.emirateId === emirateId), [geo.areas, emirateId]);
  const [areaId, setAreaId] = useState(initial?.areaId ?? "");
  const [customArea, setCustomArea] = useState("");
  const isCustomArea = areaId === "__custom__";
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={async (e) => {
      e.preventDefault(); setPending(true); setErr(null); setErrs({});
      const fd = new FormData(e.currentTarget);
      const body: Record<string, unknown> = { label: fd.get("label") || "home", emirateId, areaId: isCustomArea ? "" : areaId, street: fd.get("street"), building: fd.get("building"), unit: fd.get("unit") || null, notes: fd.get("notes") || null, isDefault: fd.get("isDefault") === "on" };
      if (isCustomArea) { body.customArea = customArea; body.areaId = ""; }
      try { const a = await api<AddressRow>(initial ? `/api/account/addresses/${initial.id}` : "/api/account/addresses", { method: initial ? "PATCH" : "POST", json: body }); onSaved(a); }
      catch (ex) { const fe = fieldErrors(ex); setErrs(fe); if (!Object.keys(fe).length) setErr(t(`error.${(ex as { code?: string }).code ?? "INTERNAL"}` as MessageKey)); }
      finally { setPending(false); }
    }}>
      <Field label={t("address.label")}>{(p) => <Input {...p} name="label" defaultValue={initial?.label ?? t("address.label.home")} />}</Field>
      <Field label={t("address.emirate")} required>{(p) => <Select {...p} value={emirateId} onChange={(e) => { setEmirateId(e.target.value); setAreaId(""); setCustomArea(""); }}>{geo.emirates.map((e) => <option key={e.id} value={e.id}>{N(e)}</option>)}</Select>}</Field>
      {emirateBlocked && <p className="text-sm text-berry md:col-span-2">{t("checkout.emirateBlocked" as MessageKey)}</p>}
      <Field label={t("address.area")} required error={errs.areaId && t("common.required")}>{(p) => <Select {...p} value={areaId} onChange={(e) => { setAreaId(e.target.value); if (e.target.value !== "__custom__") setCustomArea(""); }} required><option value="">{t("common.select")}</option>{areas.map((a) => <option key={a.id} value={a.id}>{N(a)}</option>)}<option value="__custom__">{t("address.customArea" as MessageKey)}</option></Select>}</Field>
      {isCustomArea && <Field label={t("address.customAreaName" as MessageKey)} required>{(p) => <Input {...p} value={customArea} onChange={(e) => setCustomArea(e.target.value)} required />}</Field>}
      <Field label={t("address.street")} required error={errs.street}>{(p) => <Input {...p} name="street" defaultValue={initial?.street} required />}</Field>
      <Field label={t("address.building")} required error={errs.building}>{(p) => <Input {...p} name="building" defaultValue={initial?.building} required />}</Field>
      <Field label={t("address.unit")}>{(p) => <Input {...p} name="unit" defaultValue={initial?.unit ?? ""} />}</Field>
      <Field label={t("address.notes")}>{(p) => <Input {...p} name="notes" defaultValue={initial?.notes ?? ""} />}</Field>
      <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault} className="accent-reef-600" />{t("address.default")}</label>
      {err && <p className="text-sm text-berry md:col-span-2">{err}</p>}
      <div className="flex gap-2 md:col-span-2"><Button type="submit" loading={pending} disabled={emirateBlocked}>{t("address.save")}</Button>{onCancel && <Button type="button" variant="ghost" onClick={onCancel}>{t("common.cancel")}</Button>}</div>
    </form>
  );
}
