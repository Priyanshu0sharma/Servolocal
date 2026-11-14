import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      {
        source: "/prn/:slug/:id",
        destination: "/product/:slug/:id",
      },
      {
        source: "/prn/:slug",
        destination: "/product/:slug",
      },
    ];
  },
};

export default nextConfig;
