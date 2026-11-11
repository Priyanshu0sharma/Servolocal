import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServoLocal — Local Shops • Nearby • Fast",
  description: "Hyperlocal marketplace connecting customers with real nearby local shops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-[#171717]">
        {children}
      </body>
    </html>
  );
}

