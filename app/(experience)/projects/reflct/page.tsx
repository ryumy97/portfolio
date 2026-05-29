import Header from "@/components/header";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, PageLink, Title } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { ImageSection, TextSection } from "../section";
import dashboard1 from "./assets/dashboard-1.png";
import dashboard2 from "./assets/dashboard-2.png";
import docs from "./assets/docs.png";
import home1 from "./assets/home-1.png";
import reflct from "./assets/main.png";
import logo from "./assets/reflct_logo.png";
import shareMobile from "./assets/share-mobile.png";
import share from "./assets/share.png";

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
							<div className="">Reflct</div>
							<div className="text-primary mt-[0.3em]">- Personal</div>
						</Title>
						<PageLink className="w-full mt-[1em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://www.reflct.app/"
									target="_blank"
									className="text-secondary italic"
								>
									https://www.reflct.app/
								</Link>
							</PointerEventHandler>
						</PageLink>
					</div>
					<TextSection text="Platform to easily manage and deploy 3D Gaussian Splatting (3DGS) scenes into the website." />
					<ImageSection image={reflct} />
					<ImageSection image={logo} />

					<ImageSection image={home1} />
					<ImageSection image={dashboard1} />
					<ImageSection image={dashboard2} />

					<TextSection
						text="Users can share the 3DGS scene with others."
						link="https://www.reflct.app/share-scene?token=ZGUyMDY1MjEtZmFmNi00ODFlLWI0MmYtODY0ZGE4YWJlY2FkOjdoVWM0MVB0elVQa0R1Q3pKbW0zbWQ="
						linkText="Checkout the shared scene"
					/>

					<ImageSection image={share} />
					<ImageSection image={shareMobile} className="md:w-[15vw]" />

					<TextSection
						text="Docs"
						link="https://docs.reflct.app/"
						linkText="https://docs.reflct.app/"
					/>

					<ImageSection image={docs} />

					<div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
						<Title className="">
							<div className="text-primary">Links</div>
						</Title>

						<PageLink className="w-full mt-[2em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://www.npmjs.com/package/@reflct/react"
									target="_blank"
									className="text-secondary italic"
								>
									@reflct/react - npm package
								</Link>
							</PointerEventHandler>
						</PageLink>
						<PageLink className="w-full mt-[0.5em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://github.com/Reflct"
									target="_blank"
									className="text-secondary italic"
								>
									Github - https://github.com/Reflct
								</Link>
							</PointerEventHandler>
						</PageLink>
						<PageLink className="w-full mt-[0.5em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://www.youtube.com/channel/UCVVFVZrukfeW6yQ_Scx1Eeg"
									target="_blank"
									className="text-secondary italic"
								>
									Youtube -
									https://www.youtube.com/channel/UCVVFVZrukfeW6yQ_Scx1Eeg
								</Link>
							</PointerEventHandler>
						</PageLink>
					</div>
				</main>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
