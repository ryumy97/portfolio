import Header from "@/components/header";
import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, Title } from "@/components/ui/typography";
import { ArrowRightIcon } from "lucide-react";
import Section from "./section";

import reflct from "./reflct/assets/main.png";
import typography from "./typography/assets/main.png";
import kiwi from "./kiwi/assets/main.png";
import aimhigh from "./aimhigh/assets/main.png";
import fola from "./fola/assets/cards.png";
import greenprint from "./greenprint/assets/vw.png";
import liveocean from "./liveocean/assets/ocean.png";
import feastMode from "./feast-mode/assets/mobile.png";
import heritageNewZealand from "./heritage-new-zealand/assets/main.png";

export default function Page2() {
	return (
		<PageTunnelIn>
			<SmoothScroll horizontal>
				<Header />

				<PageDescription className="absolute bottom-4 right-4 flex items-center gap-[1vw] justify-center">
					Scroll this way{" "}
					<ArrowRightIcon className="w-[min(max(2vw,16px),24px)]" />
				</PageDescription>
				<main className="flex min-h-screen w-max items-center gap-[10vw] md:gap-[5vw] px-8">
					<div className="md:max-w-[30vw] max-w-[100vw] w-screen">
						<Title className="">
							<div className="text-primary">Projects</div>
						</Title>
					</div>
					{/* Reflct */}
					<Section title="Reflct" image={reflct} link="/projects/reflct" />
					{/* Typography */}
					<Section
						title="Typography"
						image={typography}
						link="/projects/typography"
					/>
					{/* Kiwi */}
					<Section title="Kiwi" image={kiwi} link="/projects/kiwi" />
					{/* Vault? */}
					{/* Fola */}
					<Section title="Fola" image={fola} link="/projects/fola" />
					{/* Greenprint */}
					<Section
						title="Greenprint"
						image={greenprint}
						link="/projects/greenprint"
					/>
					{/* LiveOcean */}
					<Section
						title="LiveOcean"
						image={liveocean}
						link="/projects/liveocean"
					/>
					{/* Feast mode */}
					<Section
						title="Feast Mode"
						image={feastMode}
						link="/projects/feast-mode"
					/>
					{/* Heritage New Zealand */}
					<Section
						title={
							<>
								Heritage
								<br />
								New Zealand
							</>
						}
						image={heritageNewZealand}
						link="/projects/heritage-new-zealand"
					/>

					{/* AimHigh */}
					<Section title="AimHigh" image={aimhigh} link="/projects/aimhigh" />
				</main>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
