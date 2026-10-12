"use client";
import { useI18n, useLocalized } from "@/lib/i18n/provider";
import { useFmt } from "@/lib/use-format";
import { CrudPage, type FieldDef } from "./crud-page";
import { Badge } from "./ui";
import type { MessageKey } from "@/lib/i18n/messages";

const active = (t: (k: MessageKey) => string) => ({ key: "active", title: t("common.status"), render: (r: { active?: boolean; isActive?: boolean }) => <Badge tone={(r.active ?? r.isActive) ? "good" : "neutral"}>{(r.active ?? r.isActive) ? t("common.active") : t("common.inactive")}</Badge> });

export function CategoriesPage({ canWrite, parents }: { canWrite: boolean; parents: { id: string; nameAr: string }[] }) {
  const { t } = useI18n(); const L = useLocalized();
  const fields: FieldDef[] = [
    { name: "nameAr", label: "f.nameAr", required: true }, { name: "nameEn", label: "f.nameEn", required: true }, { name: "slug", label: "f.slug", required: true },
    { name: "parentId", label: "f.parent", type: "select", options: parents.map((p) => ({ value: p.id, label: p.nameAr })) },
    { name: "image", label: "f.image", placeholder: "/img/categories/… or /files/uploads/…" }, { name: "sort", label: "f.sort", type: "number", step: 1 },
    { name: "descAr", label: "f.descAr", type: "textarea" }, { name: "descEn", label: "f.descEn", type: "textarea" },
    { name: "active", label: "f.active", type: "checkbox" }, { name: "showOnHome", label: "f.showOnHome", type: "checkbox" },
  ];
  return <CrudPage<{ id: string; nameAr: string; nameEn: string; slug: string; image: string | null; sort: number; active: boolean; showOnHome: boolean; _count: { products: number } }> title={t("admin.categories")} api="/api/admin/categories" canWrite={canWrite} searchable fields={fields} columns={[
    { key: "img", title: "", render: (r) => r.image ? <img src={r.image} alt="" className="h-10 w-10 rounded-lg object-cover" /> : null },
    { key: "name", title: t("common.name"), render: (r) => <span className="font-bold">{L(r, "name")}</span> },
    { key: "slug", title: t("f.slug"), hideBelow: "md", render: (r) => <span className="num text-muted">{r.slug}</span> },
    { key: "count", title: t("admin.products"), render: (r) => <span className="num">{r._count.products}</span> },
    { key: "home", title: t("f.showOnHome"), hideBelow: "md", render: (r) => r.showOnHome ? "✓" : "—" }, active(t),
  ]} />;
}

export function SuppliersPage({ canWrite }: { canWrite: boolean }) {
  const { t } = useI18n();
  return <CrudPage<{ id: string; name: string; phone: string | null; email: string | null; active: boolean; _count: { products: number } }> title={t("admin.suppliers")} api="/api/admin/suppliers" canWrite={canWrite} searchable
    fields={[{ name: "name", label: "f.name", required: true }, { name: "phone", label: "f.phone" }, { name: "email", label: "f.email" }, { name: "notes", label: "f.notes", type: "textarea" }, { name: "active", label: "f.active", type: "checkbox" }]}
    columns={[{ key: "name", title: t("f.name"), render: (r) => <b>{r.name}</b> }, { key: "phone", title: t("f.phone"), render: (r) => <span className="num">{r.phone ?? "—"}</span> }, { key: "count", title: t("admin.products"), render: (r) => <span className="num">{r._count.products}</span> }, active(t)]} />;
}

export function AreasPage({ canWrite, emirates }: { canWrite: boolean; emirates: { id: string; nameAr: string; nameEn: string; active: boolean }[] }) {
  const { t, locale } = useI18n(); const L = useLocalized(); const { money } = useFmt();
  const fields: FieldDef[] = [
    { name: "emirateId", label: "f.emirate", type: "select", required: true, options: emirates.map((e) => ({ value: e.id, label: locale === "ar" ? e.nameAr : e.nameEn })) },
    { name: "nameAr", label: "f.nameAr", required: true }, { name: "nameEn", label: "f.nameEn", required: true },
    { name: "deliveryFee", label: "f.deliveryFee", type: "number", required: true }, { name: "freeDeliveryThreshold", label: "f.freeDeliveryThreshold", type: "number" }, { name: "minOrder", label: "f.minOrder", type: "number" },
    { name: "sort", label: "f.sort", type: "number", step: 1 }, { name: "active", label: "f.active", type: "checkbox" },
  ];
  return (
    <div className="space-y-8">
      <CrudPage<{ id: string; nameAr: string; nameEn: string; deliveryFee: string; freeDeliveryThreshold: string | null; minOrder: string; active: boolean; emirate: { nameAr: string; nameEn: string } }> title={t("admin.areas")} api="/api/admin/areas" canWrite={canWrite} searchable fields={fields} columns={[
        { key: "emirate", title: t("f.emirate"), render: (r) => L(r.emirate, "name") },
        { key: "name", title: t("f.name"), render: (r) => <b>{L(r, "name")}</b> },
        { key: "fee", title: t("f.deliveryFee"), render: (r) => <span className="num">{money(Math.round(Number(r.deliveryFee) * 100))}</span> },
        { key: "free", title: t("f.freeDeliveryThreshold"), hideBelow: "md", render: (r) => <span className="num">{r.freeDeliveryThreshold ? money(Math.round(Number(r.freeDeliveryThreshold) * 100)) : "—"}</span> },
        { key: "min", title: t("f.minOrder"), hideBelow: "md", render: (r) => <span className="num">{money(Math.round(Number(r.minOrder) * 100))}</span> }, active(t),
      ]} />
      <CrudPage<{ id: string; code: string; nameAr: string; nameEn: string; active: boolean; sort: number }> title={t("f.emirate")} api="/api/admin/emirates" canWrite={canWrite} deletable={false}
        fields={[{ name: "code", label: "f.code", required: true }, { name: "nameAr", label: "f.nameAr", required: true }, { name: "nameEn", label: "f.nameEn", required: true }, { name: "sort", label: "f.sort", type: "number", step: 1 }, { name: "active", label: "f.active", type: "checkbox" }]}
        columns={[{ key: "code", title: t("f.code"), render: (r) => <span className="num">{r.code}</span> }, { key: "name", title: t("f.name"), render: (r) => <b>{L(r, "name")}</b> }, active(t)]} />
    </div>
  );
}

export function SlotsPage({ canWrite }: { canWrite: boolean }) {
  const { t } = useI18n();
  const W = (d: number) => t(`weekday.${d}` as MessageKey);
  return <CrudPage<{ id: string; weekday: number; startTime: string; endTime: string; capacity: number; cutoffHours: number; active: boolean }> title={t("admin.slots")} api="/api/admin/slots" canWrite={canWrite}
    fields={[{ name: "weekday", label: "f.weekday", type: "select", required: true, options: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ value: d, label: W(d) })), parse: (v) => Number(v) }, { name: "startTime", label: "f.startTime", type: "time", required: true }, { name: "endTime", label: "f.endTime", type: "time", required: true }, { name: "capacity", label: "f.capacity", type: "number", step: 1, required: true }, { name: "cutoffHours", label: "f.cutoffHours", type: "number", step: 1 }, { name: "active", label: "f.active", type: "checkbox" }]}
    columns={[{ key: "weekday", title: t("f.weekday"), render: (r) => <b>{W(r.weekday)}</b> }, { key: "time", title: t("checkout.slot"), render: (r) => <span className="num" dir="ltr">{r.startTime}–{r.endTime}</span> }, { key: "capacity", title: t("f.capacity"), render: (r) => <span className="num">{r.capacity}</span> }, { key: "cutoff", title: t("f.cutoffHours"), hideBelow: "md", render: (r) => <span className="num">{r.cutoffHours}</span> }, active(t)]} />;
}

const COMPLAINT_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export function ComplaintsPage({ canWrite }: { canWrite: boolean }) {
  const { t } = useI18n(); const { dateTime } = useFmt();
  const fields: FieldDef[] = [
    { name: "name", label: "f.name", required: true }, { name: "phone", label: "f.phone", required: true },
    { name: "subject", label: "complaint.subject" as "f.name", required: true }, { name: "body", label: "complaint.body" as "f.name", type: "textarea", required: true },
    { name: "status", label: "common.status", type: "select", options: COMPLAINT_STATUSES.map((s) => ({ value: s, label: t(`complaint.status.${s}` as MessageKey) })) },
    { name: "resolution", label: "complaint.resolution" as "f.name", type: "textarea" },
  ];
  return <CrudPage<{ id: string; name: string; phone: string; subject: string; status: string; createdAt: string; user?: { name: string } | null; order?: { number: string } | null }> title={t("admin.complaints" as MessageKey)} api="/api/admin/complaints" canWrite={canWrite} searchable fields={fields} columns={[
    { key: "name", title: t("common.name"), render: (r) => <span className="font-bold">{r.name}</span> },
    { key: "phone", title: t("common.phone"), render: (r) => <span className="num">{r.phone}</span> },
    { key: "subject", title: t("complaint.subject" as MessageKey), render: (r) => r.subject },
    { key: "status", title: t("common.status"), render: (r) => <Badge tone={r.status === "RESOLVED" ? "good" : r.status === "CLOSED" ? "neutral" : r.status === "IN_PROGRESS" ? "info" : "warn"}>{t(`complaint.status.${r.status}` as MessageKey)}</Badge> },
    { key: "order", title: t("admin.orders"), hideBelow: "md", render: (r) => r.order ? <span className="num">{r.order.number}</span> : "—" },
    { key: "date", title: t("common.date"), hideBelow: "md", render: (r) => <span className="num text-xs">{dateTime(r.createdAt)}</span> },
  ]} />;
}

export function CouponsPage({ canWrite }: { canWrite: boolean }) {
  const { t } = useI18n(); const { money, date } = useFmt();
  return <CrudPage<{ id: string; code: string; type: "PERCENT" | "FIXED"; value: string; minOrder: string; maxDiscount: string | null; startsAt: string | null; endsAt: string | null; usageLimit: number | null; usedCount: number; perUserLimit: number | null; active: boolean }> title={t("admin.coupons")} api="/api/admin/coupons" canWrite={canWrite} searchable
    fields={[{ name: "code", label: "f.code", required: true }, { name: "type", label: "f.type", type: "select", required: true, options: [{ value: "PERCENT", label: t("f.PERCENT") }, { value: "FIXED", label: t("f.FIXED") }] }, { name: "value", label: "f.value", type: "number", required: true }, { name: "minOrder", label: "f.minOrder", type: "number" }, { name: "maxDiscount", label: "f.maxDiscount", type: "number" }, { name: "startsAt", label: "f.startsAt", type: "datetime" }, { name: "endsAt", label: "f.endsAt", type: "datetime" }, { name: "usageLimit", label: "f.usageLimit", type: "number", step: 1 }, { name: "perUserLimit", label: "f.perUserLimit", type: "number", step: 1 }, { name: "active", label: "f.active", type: "checkbox" }]}
    columns={[{ key: "code", title: t("f.code"), render: (r) => <b className="num">{r.code}</b> }, { key: "value", title: t("f.value"), render: (r) => <span className="num">{r.type === "PERCENT" ? `${Number(r.value)}%` : money(Math.round(Number(r.value) * 100))}</span> }, { key: "min", title: t("f.minOrder"), hideBelow: "md", render: (r) => <span className="num">{money(Math.round(Number(r.minOrder) * 100))}</span> }, { key: "used", title: t("f.usedCount"), render: (r) => <span className="num">{r.usedCount}{r.usageLimit ? ` / ${r.usageLimit}` : ""}</span> }, { key: "ends", title: t("f.endsAt"), hideBelow: "md", render: (r) => <span className="num text-xs">{r.endsAt ? date(r.endsAt) : "—"}</span> }, active(t)]} />;
}
