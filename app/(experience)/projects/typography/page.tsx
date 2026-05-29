import Header from "@/components/header";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, PageLink, Title } from "@/components/ui/typography";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { ImageSection, TextSection } from "../section";
import metaball from "./assets/01.png";
import typewriter from "./assets/02.png";
import gravity from "./assets/03.png";
import twobit from "./assets/04.png";
import wave from "./assets/05.png";
import koru from "./assets/06.png";
import fireflies from "./assets/07.png";
import home from "./assets/home.png";
import init from "./assets/init.png";
import main from "./assets/main.png";
import waveDetail from "./assets/wave.png";

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
							<div className="">Typography</div>
							<div className="text-primary mt-[0.3em]">- Personal</div>
						</Title>
						<PageLink className="w-full mt-[1em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://typography.ryumy.com/"
									target="_blank"
									className="text-secondary italic"
								>
									https://typography.ryumy.com/
								</Link>
							</PointerEventHandler>
						</PageLink>
					</div>

					<TextSection text="Mini project holding a collection of interactive kinetic typography experiences." />

					<ImageSection image={init} />

					<TextSection text="Each experience explores a different technique — from metaball filters and typewriter animations to gravity simulations and particle systems." />

					<ImageSection image={metaball} />
					<ImageSection image={typewriter} />
					<ImageSection image={gravity} />
					<ImageSection image={twobit} />
					<ImageSection image={wave} />
					<ImageSection image={waveDetail} className="md:w-[15vw]" />
					<ImageSection image={koru} />
					<ImageSection image={fireflies} />

					<div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
						<Title className="">
							<div className="text-primary">Links</div>
						</Title>

						<PageLink className="w-full mt-[2em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://github.com/ryumy97/typography"
									target="_blank"
									className="text-secondary italic"
								>
									https://github.com/ryumy97/typography
								</Link>
							</PointerEventHandler>
						</PageLink>
					</div>
				</main>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
