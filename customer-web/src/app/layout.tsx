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
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="antialiased min-h-screen bg-[#FDFBF7] text-[#2D2319]">
        {children}
      </body>
    </html>
  );
}

