import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, PageLink, Title } from "@/components/ui/typography";
import { ImageSection, TextSection } from "../section";
import dashboard1 from "./assets/dashboard-1.png";
import dashboard2 from "./assets/dashboard-2.png";
import docs from "./assets/docs.png";
import home1 from "./assets/home-1.png";
import reflct from "./assets/main.png";
import logo from "./assets/reflct_logo.png";
import share from "./assets/share.png";
import shareMobile from "./assets/share-mobile.png";

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
							<div className="">Reflct</div>
							<div className="text-primary mt-[0.3em]">- Personal · 2024</div>
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

					<TextSection text="Platform to easily manage and deploy 3D Gaussian Splatting (3DGS) scenes into the website. Aug 2024 — present." />

					<ImageSection image={reflct} type="default" />
					<ImageSection image={logo} type="default" />

					<TextSection text="Upload scenes, manage projects, and tune splats from a dashboard — then embed them on any site." />

					<ImageSection image={home1} />
					<ImageSection image={dashboard1} />
					<ImageSection image={dashboard2} />

					<TextSection
						text="@reflct/react — a React package for rendering 3DGS scenes in the browser."
						link="https://www.npmjs.com/package/@reflct/react"
						linkText="View on npm"
					/>

					<TextSection
						text="Users can share 3DGS scenes with others via a public link."
						link="https://www.reflct.app/share-scene?token=ZGUyMDY1MjEtZmFmNi00ODFlLWI0MmYtODY0ZGE4YWJlY2FkOjdoVWM0MVB0elVQa0R1Q3pKbW0zbWQ="
						linkText="Check out a shared scene"
					/>

					<ImageSection image={share} />
					<ImageSection image={shareMobile} className="w-[60vw] md:w-[20vw]" />

					<TextSection
						text="Developer docs and guides for integrating 3DGS into React apps."
						link="https://docs.reflct.app/"
						linkText="View on docs.reflct.app"
					/>

					<ImageSection image={docs} />

					<div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
						<Title className="">
							<div className="text-primary">Links</div>
						</Title>

						<PageLink className="w-full mt-[2em]">
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
						<PageLink className="w-full mt-[0.5em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://www.npmjs.com/package/@reflct/react"
									target="_blank"
									className="text-secondary italic"
								>
									https://www.npmjs.com/package/@reflct/react
								</Link>
							</PointerEventHandler>
						</PageLink>
						<PageLink className="w-full mt-[2em]">
							<PointerEventHandler asChild type="underline">
								<Link
									href="https://docs.reflct.app/"
									target="_blank"
									className="text-secondary italic"
								>
									https://docs.reflct.app/
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
									https://github.com/Reflct
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
