"use client";

import { PageTunnelIn } from "@/components/page-tunnel";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
	return (
		<PageTunnelIn>
			<motion.div
				key="home"
				className="flex flex-col flex-1 items-center justify-center"
				initial={{ opacity: 0, y: 100 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -100 }}
				transition={{ duration: 0.5 }}
			>
				<main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
					<Image
						className="dark:invert"
						src="/next.svg"
						alt="Next.js logo"
						width={100}
						height={20}
						priority
					/>
					<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
						<div className="flex h-96 w-full flex-col items-center justify-center"></div>
					</div>
					<Link href="/2">Page 2</Link>
				</main>
			</motion.div>
		</PageTunnelIn>
	);
}
