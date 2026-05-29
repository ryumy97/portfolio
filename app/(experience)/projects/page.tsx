import Header from "@/components/header";
import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, Title } from "@/components/ui/typography";
import { ArrowRightIcon } from "lucide-react";
import aimhigh from "./aimhigh/assets/main.png";
import feastMode from "./feast-mode/assets/mobile.png";
import fola from "./fola/assets/cards.png";
import greenprint from "./greenprint/assets/vw.png";
import heritageNewZealand from "./heritage-new-zealand/assets/main.png";
import kiwi from "./kiwi/assets/main.png";
import realWatergate from "./real-watergate/assets/ocean.png";
import reflct from "./reflct/assets/main.png";
import { ListItemSection } from "./section";
import typography from "./typography/assets/main.png";

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
					<ListItemSection
						title="Reflct"
						image={reflct}
						link="/projects/reflct"
					/>
					{/* Typography */}
					<ListItemSection
						title="Typography"
						image={typography}
						link="/projects/typography"
					/>
					{/* Kiwi */}
					<ListItemSection title="Kiwi" image={kiwi} link="/projects/kiwi" />
					{/* Vault? */}
					{/* Fola */}
					<ListItemSection title="Fola" image={fola} link="/projects/fola" />
					{/* Greenprint */}
					<ListItemSection
						title="Greenprint"
						image={greenprint}
						link="/projects/greenprint"
					/>
					{/* Real Watergate */}
					<ListItemSection
						title="Real Watergate"
						image={realWatergate}
						link="/projects/real-watergate"
					/>
					{/* Feast mode */}
					<ListItemSection
						title="Feast Mode"
						image={feastMode}
						link="/projects/feast-mode"
					/>
					{/* Heritage New Zealand */}
					<ListItemSection
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
					<ListItemSection
						title="AimHigh"
						image={aimhigh}
						link="/projects/aimhigh"
					/>
				</main>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
