"use client";
import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useToast } from "@/components/ui/toast";

export function ImageUpload({ value, onChange, multiple }: { value: string[]; onChange: (urls: string[]) => void; multiple?: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const fd = new FormData(); fd.append("file", f);
        const r = await fetch("/api/admin/uploads", { method: "POST", body: fd });
        if (!r.ok) throw new Error("upload");
        urls.push((await r.json()).data.url);
      }
      onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
    } catch { toast.error(t("upload.failed")); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((u) => <div key={u} className="relative h-20 w-20 overflow-hidden rounded-xl border border-reef-100"><img src={u} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => onChange(value.filter((x) => x !== u))} className="absolute end-1 top-1 rounded-full bg-white/90 p-1 text-berry" aria-label="remove"><Trash2 className="h-3 w-3" /></button></div>)}
        <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-reef-200 text-reef-600 hover:bg-mint-50"><ImagePlus className="h-6 w-6" /><input type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="hidden" disabled={busy} onChange={(e) => upload(e.target.files)} /></label>
      </div>
      <p className="text-xs text-muted">{t("upload.hint")}</p>
    </div>
  );
}
