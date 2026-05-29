import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hala's Choices – Only for my love ❤️",
  description: "A private, romantic space just for Hala to pick her choices.",
  openGraph: {
    title: "Hala's Choices",
    description: "Made with love, just for you 💕",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
