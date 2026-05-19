"use client";

import SmoothScroll from "@/components/smooth-scroll";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import Link from "next/link";

export default function Home() {
	return (
		<div className="relative w-full h-full">
			<SmoothScroll horizontal>
				<div className="flex items-center justify-start w-fit h-screen gap-20">
					<div className="m-24">
						<Link
							href="/canvas/ripple"
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
							href="/canvas/neighbor"
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
							href="/canvas/pixelation"
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
							href="/canvas/stagged"
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
			<Grid className="absolute top-0 left-0" asChild>
				<header className="col-span-full p-2">
					<Button
						variant="nav"
						size={"nav"}
						className="col-start-1 justify-start"
						asChild
					>
						<Link href="/">Home</Link>
					</Button>
				</header>
			</Grid>
		</div>
	);
}
