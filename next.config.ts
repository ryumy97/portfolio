import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/lab/particle-morphing",
        destination: "/lab/particle-morphing/image",
        permanent: true,
      },
      {
        source: "/lab/shape-shift",
        destination: "/lab/particle-morphing/surface",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
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
