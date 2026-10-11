import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { buttonClass } from "@/components/ui/button";

export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const { n, id } = await searchParams;
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-reef-600" />
      <h1 className="mt-4 text-2xl font-extrabold text-reef-800">{t("checkout.success")}</h1>
      <p className="mt-2 text-muted">{t("checkout.success.sub", { number: String(n ?? "") })}</p>
      <div className="mt-6 flex justify-center gap-2"><Link href={`/account/orders/${id}`} className={buttonClass("primary")}>{t("orders.details")}</Link><Link href="/" className={buttonClass("outline")}>{t("nav.home")}</Link></div>
    </div>
  );
}
