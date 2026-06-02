"use client";

import Image from "next/image";
import { useState } from "react";
import kiwi from "@/app/projects/kiwi/assets/circle.png";
import { useScrollEvent } from "@/components/smooth-scroll";
import { SubGrid } from "@/components/ui/grid";
import { cn } from "@/lib/utils";

const Footer = () => {
	const [isEnd, setIsEnd] = useState(false);

	useScrollEvent((lenis) => {
		setIsEnd(lenis.scroll >= lenis.limit - 20);
	});

	return (
		<SubGrid asChild>
			<footer className=" p-2 h-svh">
				<div
					className={cn(
						"col-span-full bg-primary h-full relative transition-all duration-300",
						{
							"bg-primary/10": isEnd,
						},
					)}
				>
					<Image
						src={kiwi}
						alt="Ryumy"
						className={cn(
							"absolute bottom-0 left-0 w-[30vw] md:w-[10vw] aspect-square transition-all duration-2000",
							{
								"translate-x-[100%] rotate-180": isEnd,
							},
							{
								"translate-x-[-150%] -rotate-180": !isEnd,
							},
						)}
					/>
				</div>
			</footer>
		</SubGrid>
	);
};

export default Footer;
