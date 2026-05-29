import Header from "@/components/header";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, PageLink, Title } from "@/components/ui/typography";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { ImageSection, TextSection } from "../section";
import colourChanging1 from "./assets/cup-showcase/colour-changing-1.png";
import colourChanging2 from "./assets/cup-showcase/colour-changing-2.png";
import colourChanging3 from "./assets/cup-showcase/colour-changing-3.png";
import colourChanging4 from "./assets/cup-showcase/colour-changing-4.png";
import detail1 from "./assets/cup-showcase/detail-1.png";
import detail2 from "./assets/cup-showcase/detail-2.png";
import detail3 from "./assets/cup-showcase/detail-3.png";
import detail4 from "./assets/cup-showcase/detail-4.png";
import showcaseIntro1 from "./assets/cup-showcase/intro-1.png";
import showcaseIntro2 from "./assets/cup-showcase/intro-2.png";
import showcaseLoader from "./assets/cup-showcase/loader.png";
import showcaseMain1 from "./assets/cup-showcase/main-1.png";
import showcaseMain2 from "./assets/cup-showcase/main-2.png";
import showcaseMain3 from "./assets/cup-showcase/main-3.png";
import showcaseMain4 from "./assets/cup-showcase/main-4.png";
import showcaseModal from "./assets/cup-showcase/modal.png";
import showcaseTransition from "./assets/cup-showcase/transition.png";
import main from "./assets/main.png";
import smashError from "./cup-smash/error.png";
import smashGameplay1 from "./cup-smash/gameplay-1.png";
import smashGameplay2 from "./cup-smash/gameplay-2.png";
import smashGameplay3 from "./cup-smash/gameplay-3.png";
import smashHome1 from "./cup-smash/home-1.png";
import smashHome2 from "./cup-smash/home-2.png";
import smashHome3 from "./cup-smash/home-3.png";
import smashHome4 from "./cup-smash/home-4.png";
import smashHome5 from "./cup-smash/home-5.png";
import smashHowToPlay from "./cup-smash/how-to-play.png";
import smashLoader from "./cup-smash/loader.png";
import smashMenu from "./cup-smash/menu.png";
import smashPlayModal from "./cup-smash/play-modal.png";
import smashResult1 from "./cup-smash/result-1.png";
import smashResult2 from "./cup-smash/result-2.png";
import smashResult3 from "./cup-smash/result-3.png";
import smashResult4 from "./cup-smash/result-4.png";
import smashResult5 from "./cup-smash/result-5.png";
import smashTransition from "./cup-smash/transition.png";

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
							<div className="">Feast Mode</div>
							<div className="text-primary mt-[0.3em]">- DDB NZ</div>
						</Title>
						<PageLink className="w-full mt-[1em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://mcdonalds.co.nz/page/feast-mode"
									target="_blank"
									className="text-secondary italic"
								>
									https://mcdonalds.co.nz/page/feast-mode
								</Link>
							</PointerEventHandler>
						</PageLink>
					</div>

					<TextSection text="McDonald’s New Zealand — a summer promotion built around limited-edition colour-changing Coke® cups, weekly cash draws, and an in-app Cup Smash game with instant food prizes." />

					<ImageSection image={main} className="w-[60vw] md:w-[20vw]" />

					<TextSection
						text={`Cup Showcase — a mobile microsite where customers explore all four cup designs and see them shift from B&W outlines to full colour, when chilled. 
							
							Three.js was used to display 3d cups with texture swapping to create the colour-changing effect.`}
					/>

					<ImageSection
						image={showcaseIntro1}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={showcaseIntro2}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={showcaseLoader}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={showcaseTransition}
						className="w-[60vw] md:w-[20vw]"
					/>

					<ImageSection
						image={showcaseMain1}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={showcaseMain2}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={showcaseMain3}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={showcaseMain4}
						className="w-[60vw] md:w-[20vw]"
					/>

					<ImageSection
						image={colourChanging1}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={colourChanging2}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={colourChanging3}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={colourChanging4}
						className="w-[60vw] md:w-[20vw]"
					/>

					<ImageSection image={detail1} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={detail2} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={detail3} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={detail4} className="w-[60vw] md:w-[20vw]" />

					<ImageSection
						image={showcaseModal}
						className="w-[60vw] md:w-[20vw]"
					/>

					<TextSection text="Cup Smash — an in-app game in the Macca’s app. Buy a Large Combo, earn a play, and smash cups for a chance to win." />

					<ImageSection image={smashLoader} className="w-[60vw] md:w-[20vw]" />
					<ImageSection
						image={smashHowToPlay}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection image={smashHome1} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={smashHome2} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={smashHome3} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={smashHome4} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={smashHome5} className="w-[60vw] md:w-[20vw]" />

					<ImageSection
						image={smashPlayModal}
						className="w-[60vw] md:w-[20vw]"
					/>

					<ImageSection
						image={smashTransition}
						className="w-[60vw] md:w-[20vw]"
					/>

					<ImageSection
						image={smashGameplay1}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={smashGameplay2}
						className="w-[60vw] md:w-[20vw]"
					/>
					<ImageSection
						image={smashGameplay3}
						className="w-[60vw] md:w-[20vw]"
					/>

					<ImageSection image={smashResult1} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={smashResult2} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={smashResult3} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={smashResult4} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={smashResult5} className="w-[60vw] md:w-[20vw]" />

					<ImageSection image={smashMenu} className="w-[60vw] md:w-[20vw]" />
					<ImageSection image={smashError} className="w-[60vw] md:w-[20vw]" />
				</main>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
