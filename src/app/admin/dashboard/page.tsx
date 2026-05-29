import { isAdminAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { adminGetItems, getCategories } from "@/lib/actions";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { adminLogout } from "@/lib/auth-actions";

export default async function AdminDashboardPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin");

  const [items, categories] = await Promise.all([
    adminGetItems(),
    getCategories(),
  ]);

  return (
    <AdminDashboard
      initialItems={items}
      categories={categories}
      logoutAction={adminLogout}
    />
  );
}
