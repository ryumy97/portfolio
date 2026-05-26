import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bucket.ryumy.com",
      },
    ],
  },
};

export default nextConfig;
