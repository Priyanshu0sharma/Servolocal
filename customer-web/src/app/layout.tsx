import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServoLocal — 10-15 Min Local Shops & Street Food Delivery",
  description: "Hyperlocal marketplace connecting neighborhood local stores (kirana, dairy, bakeries, street vendors) with customers.",
  icons: {
    icon: "/servolocallogo.jpeg",
    shortcut: "/servolocallogo.jpeg",
    apple: "/servolocallogo.jpeg",
  },
  openGraph: {
    title: "ServoLocal — Local Shops at your Doorstep",
    description: "Order fresh groceries, dairy, bakery & street food in 10-15 minutes from your trusted local stores.",
    url: "https://servolocal.vercel.app",
    siteName: "ServoLocal",
    images: [
      {
        url: "/servolocallogo.jpeg",
        width: 800,
        height: 800,
        alt: "ServoLocal Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FDFBF7] text-[#2D2319]">
        {children}
      </body>
    </html>
  );
}

