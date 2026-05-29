import Header from "@/components/header";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, PageLink, Title } from "@/components/ui/typography";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { ImageSection, TextSection } from "../section";
import kiwiHome from "./assets/image-1.png";
import kiwiCorner from "./assets/image-2.png";
import themeFruit from "./assets/image-3.png";
import about from "./assets/image-4.png";
import main from "./assets/main.png";

export default function Page() {
	return (
		<PageTunnelIn>
			<SmoothScroll horizontal>
				<Header />

				<PageDescription className="absolute bottom-4 right-4 flex items-center gap-[1vw] justify-center">
					Scroll this way{" "}
					<ArrowRightIcon className="w-[min(max(2vw,16px),24px)]" />
				</PageDescription>

				<main className="flex min-h-screen w-max items-center gap-[10vw] md:gap-[5vw] px-8">
					<div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
						<Title className="">
							<div className="">Kiwi</div>
							<div className="text-primary mt-[0.3em]">- Personal · 2021</div>
						</Title>
						<PageLink className="w-full mt-[1em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://kiwi.ryumy.com/"
									target="_blank"
									className="text-secondary italic"
								>
									https://kiwi.ryumy.com/
								</Link>
							</PointerEventHandler>
						</PageLink>
					</div>

					<TextSection text="A simple interactive environment built without any external libraries — vanilla JS, CSS, and a bit of physics." />

					<ImageSection image={main} />

					<TextSection text="The kiwi is a circle you can grab and throw around. Colour palettes and patterns re-skin the same shape — as a bird, a fruit, or something more abstract." />

					<ImageSection image={kiwiHome} />
					<ImageSection image={kiwiCorner} />
					<ImageSection image={themeFruit} />

					<TextSection text="Kiwi is an interesting word — a bird or a fruit. The project holds that ambiguity in one playful container you can move through a simple physical space." />

					<ImageSection image={about} />

					<div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
						<Title className="">
							<div className="text-primary">Links</div>
						</Title>

						<PageLink className="w-full mt-[2em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://kiwi.ryumy.com/"
									target="_blank"
									className="text-secondary italic"
								>
									https://kiwi.ryumy.com/
								</Link>
							</PointerEventHandler>
						</PageLink>
						<PageLink className="w-full mt-[0.5em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://github.com/ryumy97/kiwi"
									target="_blank"
									className="text-secondary italic"
								>
									https://github.com/ryumy97/kiwi
								</Link>
							</PointerEventHandler>
						</PageLink>
					</div>
				</main>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
