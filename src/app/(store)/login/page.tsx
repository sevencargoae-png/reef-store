import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/store/auth-forms";
export default async function LoginPage() {
  if (await currentUser()) redirect("/account");
  return <Suspense><LoginForm /></Suspense>;
}
