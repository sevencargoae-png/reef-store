import { redirect } from "next/navigation";
import { currentUser, type AuthUser } from "@/lib/auth/session";
import { can, isStaff, type Permission } from "@/lib/rbac";

/** Server-component guard: redirects anonymous/non-staff users to the staff login; returns `allowed` for the page's permission. */
export async function guardAdmin(...perms: Permission[]): Promise<{ user: AuthUser; allowed: boolean }> {
  const user = await currentUser();
  if (!user || !isStaff(user.role)) redirect("/admin/login");
  if (user.mustChangePassword) redirect("/admin/password");
  return { user, allowed: perms.every((p) => can(user.role, p)) };
}
