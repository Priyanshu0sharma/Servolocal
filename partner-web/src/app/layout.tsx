import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServoPartner — Seller Hub & Delivery Fleet",
  description:
    "Dukandaar Hub, Delivery Partner Fleet & Super Admin Control Center for ServoLocal.",
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
    <html lang="hi" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
