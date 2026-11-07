import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServoLocal — Instant Local Delivery",
  description:
    "Asli local dukano se instant delivery. Kirana, Fast Food, Sweets, Clothes aur 3D Custom Items — sab kuch 15 minute mein!",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}

