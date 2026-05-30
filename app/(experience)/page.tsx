import About from "@/app/(experience)/home/about";
import Hero from "@/app/(experience)/home/hero";
import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import { Grid, SubGrid } from "@/components/ui/grid";
import Footer from "./home/footer";
import Gallery from "./home/gallery";
import Lab from "./home/lab";
import Projects from "./home/projects";

export default function Home() {
	return (
		<PageTunnelIn>
			<SmoothScroll>
				<Grid>
					<SubGrid asChild>
						<main className="px-2">
							<Hero />
							<About />
							<Projects />
							<Gallery />
							<Lab />
						</main>
					</SubGrid>
					<Footer />
				</Grid>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
