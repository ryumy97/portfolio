import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, PageLink, Title } from "@/components/ui/typography";
import { ImageSection, TextSection } from "../section";
import about1 from "./assets/about-1.png";
import about2 from "./assets/about-2.png";
import intro1 from "./assets/intro-1.png";
import intro2 from "./assets/intro-2.png";
import intro3 from "./assets/intro-3.png";
import menu from "./assets/menu.png";
import ocean from "./assets/ocean.png";
import section1 from "./assets/section-1.png";
import section2 from "./assets/section-2.png";
import section3 from "./assets/section-3.png";
import section4 from "./assets/section-4.png";
import section5 from "./assets/section-5.png";
import sectionEnd from "./assets/section-end.png";

export default function Page() {
	return (
		<PageTunnelIn>
			<SmoothScroll horizontal>
				<PageDescription className="absolute bottom-4 right-4 flex items-center gap-[1vw] justify-center">
					Scroll this way{" "}
					<ArrowRightIcon className="w-[min(max(2vw,16px),24px)]" />
				</PageDescription>

				<main className="flex min-h-screen w-max items-center gap-[10vw] md:gap-[5vw] px-8">
					<div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
						<Title className="">
							<div className="">Real Watergate</div>
							<div className="text-primary mt-[0.3em]">- - DDB NZ</div>
						</Title>
						<PageLink className="w-full mt-[1em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://www.realwatergate.com/"
									target="_blank"
									className="text-secondary italic"
								>
									https://www.realwatergate.com/
								</Link>
							</PointerEventHandler>
						</PageLink>
					</div>

					<TextSection text="Explore the underwater evidence of the Real Watergate." />
					<ImageSection image={ocean} />

					<TextSection text="Three.js with custom shaders to create the look of waves on the ocean." />
					<ImageSection image={intro1} />
					<ImageSection image={intro2} />
					<ImageSection image={intro3} />

					<TextSection text="The evidences are displayed as a physical paper-like 3d object." />

					<ImageSection image={section1} type="desktop" />
					<ImageSection image={section2} />
					<ImageSection image={section3} />
					<ImageSection image={section4} />

					<TextSection text="Explore the evidence in detail." />

					<ImageSection image={section5} />

					<ImageSection image={sectionEnd} />

					<ImageSection image={menu} />

					<TextSection text="Sound design and UI interactions are woven through the experience." />

					<ImageSection image={about1} type="desktop" />
					<ImageSection image={about2} type="desktop" />

					<TextSection
						text="2024 Best Awards — Small Scale Websites, Silver."
						link="https://bestawards.co.nz/digital/small-scale-websites/ddb-group-aotearoa-nz/the-real-watergate/"
						linkText="View on Best Design Awards"
					/>

					<div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
						<Title className="">
							<div className="text-primary">Links</div>
						</Title>

						<PageLink className="w-full mt-[2em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://www.realwatergate.com/"
									target="_blank"
									className="text-secondary italic"
								>
									https://www.realwatergate.com/
								</Link>
							</PointerEventHandler>
						</PageLink>
						<PageLink className="w-full mt-[0.5em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://bestawards.co.nz/digital/small-scale-websites/ddb-group-aotearoa-nz/the-real-watergate/"
									target="_blank"
									className="text-secondary italic"
								>
									Best Design Awards — The Real Watergate
								</Link>
							</PointerEventHandler>
						</PageLink>
					</div>
				</main>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
