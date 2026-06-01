import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	turbopack: {
		rules: {
			"*.svg": {
				loaders: ["@svgr/webpack"],
				as: "*.js",
			},
		},
	},
	images: {
		qualities: [10, 75],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "bucket.ryumy.com",
			},
		],
	},
};

export default nextConfig;
