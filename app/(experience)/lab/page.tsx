"use client";

import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import Link from "next/link";

export default function Home() {
	return (
		<PageTunnelIn>
			<SmoothScroll horizontal>
				<div className="flex items-center justify-start w-fit h-screen gap-20">
					<div className="m-24">
						<Link
							href="/lab/ripple"
							className="col-start-4 col-end-8 flex items-center justify-center"
						>
							<h1 className="relative text-foreground text-[10vw] font-heading font-bold transition-all duration-300 group">
								Ripple
								<div className="absolute bottom-[8%] left-0 bg-foreground w-0 group-hover:w-full transition-all duration-300 h-1" />
							</h1>
						</Link>
					</div>
					<div className="m-24">
						<Link
							href="/lab/neighbor"
							className="col-start-4 col-end-8 flex items-center justify-center"
						>
							<h1 className="relative text-foreground text-[10vw] font-heading font-bold transition-all duration-300 group">
								Neighbor
								<div className="absolute bottom-[8%] left-0 bg-foreground w-0 group-hover:w-full transition-all duration-300 h-1" />
							</h1>
						</Link>
					</div>
					<div className="m-24">
						<Link
							href="/lab/pixelation"
							className="col-start-4 col-end-8 flex items-center justify-center"
						>
							<h1 className="relative text-foreground text-[10vw] font-heading font-bold transition-all duration-300 group">
								Pixelation
								<div className="absolute bottom-[8%] left-0 bg-foreground w-0 group-hover:w-full transition-all duration-300 h-1" />
							</h1>
						</Link>
					</div>
					<div className="m-24">
						<Link
							href="/lab/stagged"
							className="col-start-4 col-end-8 flex items-center justify-center"
						>
							<h1 className="relative text-foreground text-[10vw] font-heading font-bold transition-all duration-300 group">
								Stagged
								<div className="absolute bottom-[8%] left-0 bg-foreground w-0 group-hover:w-full transition-all duration-300 h-1" />
							</h1>
						</Link>
					</div>
				</div>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
