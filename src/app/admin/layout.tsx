import { currentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/rbac";
import { ToastProvider } from "@/components/ui/toast";
import { AdminShell } from "@/components/admin/shell";

/** Login & password pages render without the shell; everything else requires a staff session (enforced again per page). */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await currentUser();
  if (!user || !isStaff(user.role)) return <ToastProvider><div className="min-h-dvh bg-mint-50/60">{children}</div></ToastProvider>;
  return <ToastProvider><AdminShell user={user}>{children}</AdminShell></ToastProvider>;
}
