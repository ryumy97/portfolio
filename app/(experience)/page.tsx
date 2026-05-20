import About from "@/app/(experience)/home/about";
import Hero from "@/app/(experience)/home/hero";
import Header from "@/components/header";
import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import { Grid, SubGrid } from "@/components/ui/grid";
import Projects from "./home/projects";

export default function Home() {
	return (
		<PageTunnelIn>
			<SmoothScroll>
				<Grid>
					<Header />
					<SubGrid asChild>
						<main className="px-2">
							<Hero />
							<About />
							<Projects />
							<div className="col-span-full h-screen w-full bg-red-500" />
						</main>
					</SubGrid>
				</Grid>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
