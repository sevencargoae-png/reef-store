"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import { useFmt } from "@/lib/use-format";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Badge, Modal, PageHeader, Pager, Table, useApi, useErr } from "./ui";
import { ImageUpload } from "./image-upload";
import type { MessageKey } from "@/lib/i18n/messages";

interface Row { id: string; slug: string; sku: string | null; kind: "SIMPLE" | "BUNDLE"; nameAr: string; nameEn: string; descAr: string | null; descEn: string | null; categoryId: string; supplierId: string | null; unit: string; step: string; minQty: string; maxQty: string | null; approxWeightKg: string | null; soldByActualWeight: boolean; price: string; compareAtPrice: string | null; costPrice: string | null; vatApplicable: boolean; trackStock: boolean; stockQty: string; lowStockThreshold: string; origin: string | null; tags: string[]; isActive: boolean; isFeatured: boolean; sort: number; images: { url: string }[]; category: { nameAr: string; nameEn: string }; supplier: { name: string } | null; bundleItems: { componentId: string; qty: string; component: { nameAr: string; nameEn: string } }[] }
type Opt = { id: string; nameAr: string; nameEn: string };

const UNITS = ["KG", "PIECE", "BUNCH", "PACK", "BOX"];
const n = (v: string | null | undefined) => (v == null || v === "" ? null : Number(v));

function Editor({ row, categories, suppliers, onDone }: { row: Row | null; categories: Opt[]; suppliers: { id: string; name: string }[]; onDone: () => void }) {
  const { t, locale } = useI18n();
  const toast = useToast(); const err = useErr();
  const [v, setV] = useState<Record<string, unknown>>(() => ({
    slug: row?.slug ?? "", sku: row?.sku ?? "", kind: row?.kind ?? "SIMPLE", nameAr: row?.nameAr ?? "", nameEn: row?.nameEn ?? "", descAr: row?.descAr ?? "", descEn: row?.descEn ?? "",
    categoryId: row?.categoryId ?? categories[0]?.id ?? "", supplierId: row?.supplierId ?? "", unit: row?.unit ?? "KG", step: row?.step ?? "1", minQty: row?.minQty ?? "1", maxQty: row?.maxQty ?? "", approxWeightKg: row?.approxWeightKg ?? "",
    soldByActualWeight: row?.soldByActualWeight ?? false, price: row?.price ?? "", compareAtPrice: row?.compareAtPrice ?? "", costPrice: row?.costPrice ?? "", vatApplicable: row?.vatApplicable ?? true, trackStock: row?.trackStock ?? true, stockQty: row?.stockQty ?? "0", lowStockThreshold: row?.lowStockThreshold ?? "5",
    origin: row?.origin ?? "", tags: (row?.tags ?? []).join(", "), isActive: row?.isActive ?? true, isFeatured: row?.isFeatured ?? false, sort: row?.sort ?? 0, images: row?.images.map((i) => i.url) ?? [],
    bundleItems: row?.bundleItems.map((b) => ({ productId: b.componentId, qty: Number(b.qty), name: locale === "ar" ? b.component.nameAr : b.component.nameEn })) ?? [],
  }));
  const set = (k: string, x: unknown) => setV((s) => ({ ...s, [k]: x }));
  const [pending, setPending] = useState(false);
  const [compQ, setCompQ] = useState("");
  const { data: comps } = useApi<{ items: Row[] }>(v.kind === "BUNDLE" && compQ.length > 1 ? `/api/admin/products?q=${encodeURIComponent(compQ)}` : null);
  const S = (k: string) => String(v[k] ?? "");
  const txt = (k: string, label: MessageKey, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => <Field label={t(label)} required={extra?.required}>{(p) => <Input {...p} value={S(k)} onChange={(e) => set(k, e.target.value)} {...extra} />}</Field>;
  const num = (k: string, label: MessageKey, req = false) => <Field label={t(label)} required={req}>{(p) => <Input {...p} type="number" step="any" min={0} dir="ltr" value={S(k)} onChange={(e) => set(k, e.target.value)} required={req} />}</Field>;
  const chk = (k: string, label: MessageKey) => <label className="flex items-center gap-2 py-2 text-sm font-semibold"><input type="checkbox" checked={!!v[k]} onChange={(e) => set(k, e.target.checked)} className="accent-reef-600" />{t(label)}</label>;
  const bundle = v.bundleItems as { productId: string; qty: number; name: string }[];
  return (
    <form className="grid gap-3 md:grid-cols-3" onSubmit={async (e) => {
      e.preventDefault(); setPending(true);
      const body = { slug: S("slug"), sku: S("sku") || null, kind: v.kind, nameAr: S("nameAr"), nameEn: S("nameEn"), descAr: S("descAr") || null, descEn: S("descEn") || null, categoryId: S("categoryId"), supplierId: S("supplierId") || null, unit: v.unit, step: Number(S("step")), minQty: Number(S("minQty")), maxQty: n(S("maxQty")), approxWeightKg: n(S("approxWeightKg")), soldByActualWeight: !!v.soldByActualWeight, price: Number(S("price")), compareAtPrice: n(S("compareAtPrice")), costPrice: n(S("costPrice")), vatApplicable: !!v.vatApplicable, trackStock: !!v.trackStock, stockQty: Number(S("stockQty")), lowStockThreshold: Number(S("lowStockThreshold")), origin: S("origin") || null, tags: S("tags").split(/[,،]/).map((x) => x.trim()).filter(Boolean), isActive: !!v.isActive, isFeatured: !!v.isFeatured, sort: Number(v.sort ?? 0), images: v.images, bundleItems: bundle.map((b) => ({ productId: b.productId, qty: b.qty })) };
      try { await api(row ? `/api/admin/products/${row.id}` : "/api/admin/products", { method: row ? "PATCH" : "POST", json: body }); toast.success(t("admin.saved")); onDone(); } catch (ex) { toast.error(err(ex)); } finally { setPending(false); }
    }}>
      {txt("nameAr", "f.nameAr", { required: true })}{txt("nameEn", "f.nameEn", { required: true, dir: "ltr" })}{txt("slug", "f.slug", { required: true, dir: "ltr", pattern: "[a-z0-9-]+" })}
      <Field label={t("f.kind")}>{(p) => <Select {...p} value={S("kind")} onChange={(e) => set("kind", e.target.value)}><option value="SIMPLE">{t("f.kind.SIMPLE")}</option><option value="BUNDLE">{t("f.kind.BUNDLE")}</option></Select>}</Field>
      <Field label={t("f.category")} required>{(p) => <Select {...p} value={S("categoryId")} onChange={(e) => set("categoryId", e.target.value)} required>{categories.map((c) => <option key={c.id} value={c.id}>{locale === "ar" ? c.nameAr : c.nameEn}</option>)}</Select>}</Field>
      <Field label={t("f.supplier")}>{(p) => <Select {...p} value={S("supplierId")} onChange={(e) => set("supplierId", e.target.value)}><option value="">—</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
      <Field label={t("f.unit")}>{(p) => <Select {...p} value={S("unit")} onChange={(e) => set("unit", e.target.value)}>{UNITS.map((u) => <option key={u} value={u}>{t(`unit.${u}` as MessageKey)}</option>)}</Select>}</Field>
      {num("step", "f.step", true)}{num("minQty", "f.minQty", true)}{num("maxQty", "f.maxQty")}{num("approxWeightKg", "f.approxWeightKg")}
      {num("price", "f.price", true)}{num("compareAtPrice", "f.compareAtPrice")}{num("costPrice", "f.costPrice")}
      {num("stockQty", "f.stockQty")}{num("lowStockThreshold", "f.lowStockThreshold")}{txt("sku", "f.sku", { dir: "ltr" })}{txt("origin", "f.origin")}
      <div className="md:col-span-2">{txt("tags", "f.tags")}</div>
      <div className="md:col-span-3 grid grid-cols-2 gap-x-4 md:grid-cols-4">{chk("soldByActualWeight", "f.soldByActualWeight")}{chk("trackStock", "f.trackStock")}{chk("vatApplicable", "f.vatApplicable")}{chk("isActive", "f.isActive")}{chk("isFeatured", "f.isFeatured")}</div>
      <div className="md:col-span-3"><Field label={t("f.descAr")}>{(p) => <Textarea {...p} value={S("descAr")} onChange={(e) => set("descAr", e.target.value)} className="min-h-16" />}</Field></div>
      <div className="md:col-span-3"><Field label={t("f.descEn")}>{(p) => <Textarea {...p} value={S("descEn")} onChange={(e) => set("descEn", e.target.value)} className="min-h-16" dir="ltr" />}</Field></div>
      <div className="md:col-span-3"><div className="mb-1 text-sm font-semibold">{t("f.images")}</div><ImageUpload value={v.images as string[]} onChange={(u) => set("images", u)} multiple /></div>
      {v.kind === "BUNDLE" && (
        <div className="md:col-span-3 rounded-xl border border-reef-100 p-3">
          <div className="mb-2 text-sm font-semibold">{t("f.bundleItems")}</div>
          <ul className="mb-2 space-y-1 text-sm">{bundle.map((b, i) => <li key={b.productId} className="flex items-center gap-2"><span className="flex-1">{b.name}</span><Input type="number" step="any" min={0.001} value={b.qty} dir="ltr" className="!w-24 !py-1" onChange={(e) => set("bundleItems", bundle.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} /><Button type="button" size="sm" variant="ghost" className="text-berry" onClick={() => set("bundleItems", bundle.filter((_, j) => j !== i))}>×</Button></li>)}</ul>
          <Input value={compQ} onChange={(e) => setCompQ(e.target.value)} placeholder={t("admin.search")} />
          {comps && compQ.length > 1 && <ul className="mt-1 max-h-40 overflow-auto rounded-xl border border-reef-100 text-sm">{comps.items.filter((c) => c.kind === "SIMPLE" && c.id !== row?.id && !bundle.some((b) => b.productId === c.id)).map((c) => <li key={c.id}><button type="button" className="w-full px-3 py-1.5 text-start hover:bg-mint-50" onClick={() => { set("bundleItems", [...bundle, { productId: c.id, qty: 1, name: locale === "ar" ? c.nameAr : c.nameEn }]); setCompQ(""); }}>{locale === "ar" ? c.nameAr : c.nameEn}</button></li>)}</ul>}
        </div>
      )}
      <div className="md:col-span-3"><Button type="submit" loading={pending}>{t("common.save")}</Button></div>
    </form>
  );
}

function StockDialog({ row, onDone }: { row: Row; onDone: () => void }) {
  const { t } = useI18n(); const toast = useToast(); const err = useErr();
  const [pending, setPending] = useState(false);
  return (
    <form className="grid gap-3" onSubmit={async (e) => { e.preventDefault(); setPending(true); const fd = new FormData(e.currentTarget); try { await api(`/api/admin/products/${row.id}/stock`, { method: "POST", json: { delta: Number(fd.get("delta")), reason: fd.get("reason"), note: fd.get("note") || null } }); toast.success(t("admin.saved")); onDone(); } catch (ex) { toast.error(err(ex)); } finally { setPending(false); } }}>
      <p className="text-sm text-muted">{t("f.stockQty")}: <b className="num">{row.stockQty}</b></p>
      <Field label={t("f.stockDelta")} required>{(p) => <Input {...p} name="delta" type="number" step="any" dir="ltr" required />}</Field>
      <Field label={t("f.stockReason")}>{(p) => <Select {...p} name="reason"><option value="RECEIVE">RECEIVE</option><option value="ADJUST">ADJUST</option><option value="WASTE">WASTE</option></Select>}</Field>
      <Field label={t("f.notes")}>{(p) => <Input {...p} name="note" />}</Field>
      <Button type="submit" loading={pending}>{t("common.save")}</Button>
    </form>
  );
}

export function ProductsView({ categories, suppliers, canWrite }: { categories: Opt[]; suppliers: { id: string; name: string }[]; canWrite: boolean }) {
  const { t, locale } = useI18n();
  const L = useLocalized();
  const { money } = useFmt();
  const sp = useSearchParams();
  const toast = useToast(); const err = useErr();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [cat, setCat] = useState("");
  const [low, setLow] = useState(false);
  const [page, setPage] = useState(1);
  const url = useMemo(() => `/api/admin/products?page=${page}&q=${encodeURIComponent(q)}&categoryId=${cat}${low ? "&lowStock=1" : ""}`, [page, q, cat, low]);
  const { data, loading, reload } = useApi<{ items: Row[]; meta: { page: number; pages: number; total: number } }>(url);
  const [editing, setEditing] = useState<Row | null | "new">(null);
  const [stock, setStock] = useState<Row | null>(null);
  return (
    <div>
      <PageHeader title={t("admin.products")}>
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t("admin.search")} className="!h-10 !w-48" />
        <Select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }} className="!h-10 !w-44 !py-1"><option value="">{t("common.all")}</option>{categories.map((c) => <option key={c.id} value={c.id}>{locale === "ar" ? c.nameAr : c.nameEn}</option>)}</Select>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} className="accent-reef-600" />{t("kpi.lowStock")}</label>
        {canWrite && <Button onClick={() => setEditing("new")}>{t("admin.new")}</Button>}
      </PageHeader>
      <Table<Row> rows={data?.items ?? null} loading={loading} onRow={canWrite ? (r) => setEditing(r) : undefined} columns={[
        { key: "img", title: "", render: (r) => r.images[0] ? <img src={r.images[0].url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="block h-10 w-10 rounded-lg bg-mint-100" /> },
        { key: "name", title: t("f.name"), render: (r) => <div><div className="font-bold">{L(r, "name")}</div><div className="text-xs text-muted">{L(r.category, "name")}{r.kind === "BUNDLE" && <Badge tone="info">{t("f.kind.BUNDLE")}</Badge>}</div></div> },
        { key: "price", title: t("f.price"), render: (r) => <span className="num">{money(Math.round(Number(r.price) * 100))} / {t(`unit.${r.unit}` as MessageKey)}</span> },
        { key: "cost", title: t("f.costPrice"), hideBelow: "lg", render: (r) => <span className="num text-muted">{r.costPrice ? money(Math.round(Number(r.costPrice) * 100)) : "—"}</span> },
        { key: "stock", title: t("f.stockQty"), render: (r) => r.trackStock ? <Badge tone={Number(r.stockQty) <= 0 ? "bad" : Number(r.stockQty) <= Number(r.lowStockThreshold) ? "warn" : "good"}>{Number(r.stockQty)}</Badge> : <span className="text-xs text-muted">∞</span> },
        { key: "active", title: t("common.status"), hideBelow: "md", render: (r) => <Badge tone={r.isActive ? "good" : "neutral"}>{r.isActive ? t("common.active") : t("common.inactive")}</Badge> },
        ...(canWrite ? [{ key: "_a", title: "", className: "text-end", render: (r: Row) => <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>{r.trackStock && <Button size="sm" variant="outline" onClick={() => setStock(r)}>{t("f.stockAdjust")}</Button>}<Button size="sm" variant="ghost" className="text-berry" onClick={async () => { if (!confirm(t("admin.confirmDelete"))) return; try { await api(`/api/admin/products/${r.id}`, { method: "DELETE" }); toast.success(t("admin.deleted")); reload(); } catch (ex) { toast.error(err(ex)); } }}>{t("common.delete")}</Button></div> }] : []),
      ]} />
      <Pager meta={data?.meta} onPage={setPage} />
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? t("admin.new") : t("common.edit")} wide>
        {editing !== null && <Editor key={editing === "new" ? "new" : editing.id} row={editing === "new" ? null : editing} categories={categories} suppliers={suppliers} onDone={() => { setEditing(null); reload(); }} />}
      </Modal>
      <Modal open={!!stock} onClose={() => setStock(null)} title={t("f.stockAdjust")}>{stock && <StockDialog row={stock} onDone={() => { setStock(null); reload(); }} />}</Modal>
    </div>
  );
}
