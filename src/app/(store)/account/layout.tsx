import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { AccountNav } from "@/components/store/account-nav";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");
  return (
    <div className="grid gap-6 py-6 md:grid-cols-[240px_1fr]">
      <AccountNav user={{ name: user.name, phone: user.phone, role: user.role }} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
