import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServoLocal — Master Admin Console",
  description: "Executive Command Center & Real-time Platform Operations for ServoLocal Marketplace",
  icons: {
    icon: "/servolocallogo.jpeg",
    shortcut: "/servolocallogo.jpeg",
    apple: "/servolocallogo.jpeg",
  },
  openGraph: {
    title: "ServoLocal — Master Admin Console",
    description: "Executive Command Center & Real-time Platform Operations",
    url: "https://admin-web-one-jet.vercel.app",
    siteName: "ServoLocal Admin",
    images: [
      {
        url: "/servolocallogo.jpeg",
        width: 800,
        height: 800,
        alt: "ServoLocal Admin Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

