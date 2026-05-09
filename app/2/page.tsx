"use client";

import { PageTunnelIn } from "@/components/page-tunnel";
import { motion } from "motion/react";
import Link from "next/link";

export default function Page2() {
	return (
		<PageTunnelIn>
			<motion.div
				key="page2"
				className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black"
				initial={{ opacity: 0, y: 100 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -100 }}
				transition={{ duration: 0.5 }}
			>
				<div>Page 2</div>
				<Link href="/">Home</Link>
			</motion.div>
		</PageTunnelIn>
	);
}
