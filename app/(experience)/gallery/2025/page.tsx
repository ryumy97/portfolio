import { getGalleryImages } from "@/app/actions/vault";
import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, Title } from "@/components/ui/typography";
import { createImageUrl } from "@/lib/image";
import { ArrowRightIcon } from "lucide-react";
import { ImageSection } from "../section";

export default async function Page() {
	const images = await getGalleryImages("gallery-2025");

	return (
		<PageTunnelIn>
			<SmoothScroll horizontal>
				<PageDescription className="absolute bottom-4 right-4 flex items-center gap-[1vw] justify-center">
					Scroll this way{" "}
					<ArrowRightIcon className="w-[min(max(2vw,16px),24px)]" />
				</PageDescription>

				<main className="flex min-h-screen w-max items-center gap-[10vw] md:gap-[5vw] px-8">
					<div className="md:max-w-[30vw] max-w-[100vw] w-screen">
						<Title className="">
							<div className="text-primary">Gallery</div>
						</Title>
					</div>

					{images.map((image) => (
						<ImageSection
							key={image.storageKey}
							image={createImageUrl(image.storageKey)}
							alt={image.filename}
							layout={image.isPortrait ? "portrait" : "landscape"}
						/>
					))}
				</main>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
