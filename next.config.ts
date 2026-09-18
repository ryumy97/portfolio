import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  async redirects() {
    return [
      {
        source: "/about",
        destination: "/cv",
        permanent: true,
      },
      {
        source: "/projects",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/projects/:path*",
        destination: "/work/:path*",
        permanent: true,
      },
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
      {
        source: "/blogs",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/blogs/:path*",
        destination: "/blog/:path*",
        permanent: true,
      },
      {
        source: "/blog/studying-the-nature-of-code",
        destination: "/blog/the-nature-of-code/studying-the-nature-of-code",
        permanent: true,
      },
      {
        source: "/blog/randomness",
        destination: "/blog/the-nature-of-code/randomness",
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
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bucket.ryumy.com",
      },
    ],
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      "remark-frontmatter",
      "remark-mdx-frontmatter",
      "remark-gfm",
      "remark-math",
    ],
    rehypePlugins: ["rehype-katex"],
  },
});

export default withMDX(nextConfig);
