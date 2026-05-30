"use client";

import Link from "next/link";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import { Grid, SubGrid } from "@/components/ui/grid";
import { PageDescription, Title } from "@/components/ui/typography";

const LABS = [
	{ href: "/lab/ripple", title: "Ripple" },
	{ href: "/lab/neighbor", title: "Neighbor" },
	{ href: "/lab/pixelation", title: "Pixelation" },
	{ href: "/lab/cmyk", title: "CMYK" },
	{ href: "/lab/light-curtain", title: "Light Curtain" },
	{ href: "/lab/stagged", title: "Staggered" },
] as const;

export default function Labs() {
	return (
		<PageTunnelIn>
			<SmoothScroll>
				<div className="mt-14"></div>
				<Grid className="w-full">
					<div className="col-start-2 col-end-10">
						<Title className="text-primary">Lab</Title>
						<PageDescription>Something fun</PageDescription>
					</div>
					<SubGrid className="col-start-2 col-end-10 mt-12">
						{LABS.map(({ href, title }) => (
							<div key={href} className="pr-[1vw]">
								<PointerEventHandler asChild type="underline" offsetY={8}>
									<Link href={href} className="col-span-2 md:col-span-1">
										<span className="relative font-heading font-bold leading-none transition-all duration-300 text-[1.5vw]">
											{title}
											<span className="absolute bottom-[8%] left-0 h-0.5 w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
										</span>
									</Link>
								</PointerEventHandler>
							</div>
						))}
					</SubGrid>
				</Grid>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
