import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin – Hala's Choices",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-admin min-h-screen">{children}</div>;
}
