export const dynamic = 'force-dynamic';

import { isHalaAuthenticated } from "@/lib/auth";
import { halaLogin } from "@/lib/auth-actions";
import HalaWelcome from "@/components/hala/HalaWelcome";
import HalaPasswordGate from "@/components/hala/HalaPasswordGate";

export default async function HalaPage() {
  const hasPassword = !!process.env.HALA_PASSWORD;
  const authenticated = await isHalaAuthenticated();

  if (hasPassword && !authenticated) {
    return <HalaPasswordGate loginAction={halaLogin} />;
  }

  return <HalaWelcome />;
}
