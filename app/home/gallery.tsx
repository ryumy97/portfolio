"use client";

import { PointerEventHandler } from "@/components/pointer";
import { useScrollEvent } from "@/components/smooth-scroll";
import { SubGrid } from "@/components/ui/grid";
import { SectionDescription } from "@/components/ui/typography";
import { createImageUrl } from "@/lib/image";
import { ArrowRightIcon } from "lucide-react";
import { cubicBezier, motion, transform, useMotionValue } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const Gallery = () => {
	const containerRef = useRef<HTMLDivElement>(null);

	const y = useMotionValue("0%");

	useScrollEvent((_lenis) => {
		const rect = containerRef.current?.getBoundingClientRect();

		if (!rect) return;

		const progressValue = transform(
			window.innerHeight - rect.top,
			[0, rect.height + window.innerHeight],
			[0, 1],
			{
				clamp: true,
			},
		);

		const yValue = transform(progressValue, [0, 1], [-10, 0], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});
		y.set(`${yValue}%`);
	});

	return (
		<SubGrid className="col-span-full relative aspect-video" ref={containerRef}>
			<motion.div
				className="relative border-white border-[0.5vw] col-start-2 col-span-6 md:col-start-4 md:col-span-3 row-start-3 mt-4 aspect-landscape shadow-2xl"
				style={{ y }}
			>
				<Image
					src={createImageUrl(
						"upload/cb84b9a6-e044-4439-af24-900e9f61a7b3/DSC_0788.JPG",
					)}
					alt="Gallery"
					fill
					sizes="75vw"
					placeholder="blur"
				/>
			</motion.div>

			<motion.div
				className="relative border-white border-[0.5vw] col-start-4 col-span-6 md:col-start-2 md:col-span-3 row-start-4 mt-4 aspect-landscape shadow-2xl"
				style={{ y }}
			>
				<Image
					src={createImageUrl(
						"upload/b502d3d8-3fff-43c7-9935-cef2ff95a4a6/SAM_0091.png",
					)}
					alt="Gallery"
					fill
					sizes="75vw"
					placeholder="blur"
				/>
			</motion.div>
			<motion.div
				className="relative border-white border-[0.5vw] col-start-3 col-span-5 md:col-start-7 md:col-span-2 row-start-5 mt-4 aspect-portrait shadow-2xl"
				style={{ y }}
			>
				<Image
					src={createImageUrl(
						"upload/240ccb84-acbb-4d2b-85a8-890704c6aa02/DSC_3557.JPG",
					)}
					alt="Gallery"
					fill
					sizes="60vw"
					placeholder="blur"
				/>
			</motion.div>

			<SectionDescription className="row-start-1 col-span-4 md:row-start-2 md:col-span-2 md:col-start-2">
				What I see
			</SectionDescription>
			<div className="row-start-2 col-span-4 col-start-7 md:col-start-4 md:row-start-2 flex items-center justify-start my-6">
				<PointerEventHandler asChild type="underline">
					<Link
						href="/gallery"
						className="text-[min(max(5vw,16px),24px)] flex items-center justify-start gap-2 max-md:underline"
					>
						Gallery
						<ArrowRightIcon
							className="w-[min(max(5vw,16px),24px)]"
							strokeWidth={1.5}
						/>
					</Link>
				</PointerEventHandler>
			</div>
		</SubGrid>
	);
};

export default Gallery;
