import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServoLocal — Instant Local Delivery",
  description:
    "Asli local dukano se instant delivery. Kirana, Fast Food, Sweets, Clothes aur 3D Custom Items — sab kuch 15 minute mein!",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.jpeg", sizes: "192x192", type: "image/jpeg" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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

