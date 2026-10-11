import { currentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/rbac";
import { PasswordForm } from "@/components/admin/password-form";
export default async function Page() {
  const u = await currentUser();
  if (!u || !isStaff(u.role)) redirect("/admin/login");
  return <PasswordForm forced={u.mustChangePassword} />;
}
