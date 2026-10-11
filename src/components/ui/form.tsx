"use client";
import { useId } from "react";
import { cx } from "./cx";

const field = "w-full rounded-xl border border-reef-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-reef-400 focus:outline-none focus:ring-2 focus:ring-reef-100 disabled:bg-mint-50";

export function Input({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={cx(field, className)} {...p} />; }
export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cx(field, className)} {...p} />; }
export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cx(field, "min-h-24", className)} {...p} />; }

export function Field({ label, error, hint, required, children }: { label: string; error?: string; hint?: string; required?: boolean; children: (p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-reef-900">{label}{required && <span className="text-berry"> *</span>}</label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : hint ? `${id}-hint` : undefined })}
      {error ? <p id={`${id}-err`} className="text-xs text-berry">{error}</p> : hint ? <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
