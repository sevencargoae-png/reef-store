import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/rbac";
import { StaffLogin } from "@/components/admin/staff-login";
export default async function AdminLogin() {
  const u = await currentUser();
  if (u && isStaff(u.role)) redirect("/admin");
  return <StaffLogin />;
}
