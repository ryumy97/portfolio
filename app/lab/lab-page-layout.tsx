"use client";

import { MenuIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { cn } from "@/lib/utils";

type LabPageLayoutProps = {
	title: string;
	sidebar: ReactNode;
	children: ReactNode;
};

export function LabPageLayout({
	title,
	sidebar,
	children,
}: LabPageLayoutProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<PageTunnelIn>
			<Grid className="fixed inset-0 h-full w-full">
				<motion.div
					className={cn(
						"absolute inset-0 md:col-start-1 md:col-end-3 border-r md:relative pt-10 pl-2 z-10 overflow-y-auto transition-transform duration-300 ease-default bg-background",
						{
							"max-md:translate-x-0": isOpen,
							"max-md:-translate-x-full": !isOpen,
						},
					)}
				>
					<div className="col-start-1 relative">
						<PointerEventHandler asChild type="underline">
							<Button variant="ghost" size="nav" asChild>
								<Link href="/lab">Back</Link>
							</Button>
						</PointerEventHandler>
					</div>
					<div className="pt-4 pr-2 pb-8 flex flex-col gap-4">
						<h1 className="relative text-foreground text-[28px] leading-none font-heading font-bold transition-all duration-300 group">
							{title}
						</h1>
						{sidebar}
					</div>
				</motion.div>
				<div className="absolute inset-0 md:relative col-span-full row-start-2 md:row-start-1 md:col-start-3 md:col-end-11 flex flex-col items-center justify-center">
					{children}
				</div>
				<Button
					className={cn(
						"flex md:hidden absolute top-[48px] left-2 z-20 transition-transform duration-300 ease-default",
						{
							"translate-x-[calc(100vw-8px*2-100%)]": isOpen,
							"translate-x-0": !isOpen,
						},
					)}
					onClick={() => setIsOpen(!isOpen)}
				>
					<MenuIcon />
				</Button>
			</Grid>
		</PageTunnelIn>
	);
}
