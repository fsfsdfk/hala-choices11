// ============================================
// Simple password-based auth helpers
// ============================================
import { cookies } from "next/headers";

const ADMIN_COOKIE = "hc_admin_session";
const HALA_COOKIE = "hc_hala_session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "1";
}

export async function isHalaAuthenticated(): Promise<boolean> {
  // If no password is set, always authenticated
  if (!process.env.HALA_PASSWORD) return true;
  const cookieStore = await cookies();
  return cookieStore.get(HALA_COOKIE)?.value === "1";
}

export { ADMIN_COOKIE, HALA_COOKIE };
