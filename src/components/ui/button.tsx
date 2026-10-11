import Link from "next/link";
import { cx } from "./cx";

const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reef-400 focus-visible:ring-offset-2";
const variants = {
  primary: "bg-reef-600 text-white hover:bg-reef-700 shadow-soft",
  secondary: "bg-mint-100 text-reef-800 hover:bg-mint-200",
  outline: "border border-reef-200 bg-white text-reef-800 hover:bg-mint-50",
  ghost: "text-reef-800 hover:bg-mint-100",
  danger: "bg-berry text-white hover:brightness-95",
};
const sizes = { sm: "h-9 px-4 text-sm", md: "h-11 px-5 text-sm", lg: "h-12 px-7 text-base", icon: "h-10 w-10" };
export type Variant = keyof typeof variants;
export const buttonClass = (v: Variant = "primary", s: keyof typeof sizes = "md", extra?: string) => cx(base, variants[v], sizes[s], extra);

export function Button({ variant = "primary", size = "md", className, loading, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", size = "md", className, href, children }: { variant?: Variant; size?: keyof typeof sizes; className?: string; href: string; children: React.ReactNode }) {
  return <Link href={href} className={buttonClass(variant, size, className)}>{children}</Link>;
}
