"use client";

import SmoothScroll from "@/components/smooth-scroll";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import Link from "next/link";

export default function Home() {
	return (
		<div className="relative w-full h-full">
			<SmoothScroll horizontal>
				<Grid>
					<div className="col-span-full my-24">
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
					<div className="col-span-full my-24">
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
				</Grid>
			</SmoothScroll>
			<Grid className="absolute top-0 left-0" asChild>
				<header className="col-span-full p-2">
					<Button
						variant="nav"
						size={"text"}
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
