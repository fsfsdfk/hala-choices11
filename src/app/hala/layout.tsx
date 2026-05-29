import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hala's Choices – Only for my love ❤️",
};

export default function HalaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-romantic min-h-screen">
      {children}
    </div>
  );
}
