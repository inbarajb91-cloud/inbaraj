import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Server-side rendering required for middleware support */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
