import { isAdminAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLogin from "@/components/admin/AdminLogin";
import { adminLogin } from "@/lib/auth-actions";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();
  if (authenticated) redirect("/admin/dashboard");

  return <AdminLogin loginAction={adminLogin} />;
}
