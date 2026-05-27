"use client";

import AimHigh from "@/app/(experience)/projects/aimhigh/assets/aimhigh.png";
import Fola from "@/app/(experience)/projects/fola/assets/main.png";
import Greenprint from "@/app/(experience)/projects/greenprint/assets/canvas.png";
import Kiwi from "@/app/(experience)/projects/kiwi/assets/mobile.png";
import Reflct from "@/app/(experience)/projects/reflct/assets/home-1.png";
import Typography from "@/app/(experience)/projects/typography/assets/06.png";
import { PointerEventHandler } from "@/components/pointer";
import { SectionDescription } from "@/components/ui/typography";
import { WebGLPixelShiftCanvas } from "@/components/webgl/webgl-pixel-shift-canvas";
import { SCREEN, useMediaQuery } from "@/hooks/use-media-query";
import type Lenis from "lenis";
import { ArrowRightIcon } from "lucide-react";
import {
	motion,
	transform,
	useMotionValue,
	useMotionValueEvent,
} from "motion/react";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useScrollEvent } from "../../../components/smooth-scroll";
import { Grid, SubGrid } from "../../../components/ui/grid";
import FeastMode from "@/app/(experience)/projects/feast-mode/assets/mobile.png";
import LiveOcean from "@/app/(experience)/projects/liveocean/assets/main.png";
import HeritageNewZealand from "@/app/(experience)/projects/heritage-new-zealand/assets/hero.png";

const MAX_SHIFT_PX = 48;
const VELOCITY_SCALE = 0.03;

type ProjectImage = {
	src: StaticImageData;
	alt: string;
	className: string;
};

const PROJECT_IMAGES: ProjectImage[] = [
	{
		src: Kiwi,
		alt: "Kiwi",
		className:
			"col-start-3 col-span-2 row-start-2 md:col-start-2 md:col-span-1 md:row-start-3",
	},
	{
		src: Typography,
		alt: "Typography",
		className:
			"col-start-2 col-span-2 row-start-1 md:col-start-5 md:col-span-1 md:row-start-1",
	},
	{
		src: AimHigh,
		alt: "AimHigh",
		className:
			"col-start-4 col-span-4 row-start-4 md:col-start-6 md:col-span-2 md:row-start-2",
	},
	{
		src: Reflct,
		alt: "Reflect",
		className:
			"col-start-6 col-span-4 row-start-3 md:col-start-8 md:col-span-2 md:row-start-4",
	},
	{
		src: LiveOcean,
		alt: "LiveOcean",
		className:
			"col-start-5 col-span-4 row-start-5 md:col-start-4 md:col-span-2 md:row-start-3",
	},
	{
		src: Fola,
		alt: "Fola",
		className:
			"col-start-5 col-span-4 row-start-2 md:col-start-7 md:col-span-2 md:row-start-1",
	},
	{
		src: FeastMode,
		alt: "Feast Mode",
		className:
			"col-start-5 col-span-2 row-start-1 md:col-start-3 md:col-span-1 md:row-start-1",
	},
	{
		src: Greenprint,
		alt: "Greenprint",
		className:
			"col-start-2 col-span-4 row-start-3 md:col-start-5 md:col-span-2 md:row-start-4",
	},
	{
		src: HeritageNewZealand,
		alt: "Heritage New Zealand",
		className:
			"col-start-1 col-span-4 row-start-5 md:col-start-7 md:col-span-2 md:row-start-3",
	},
];

function scrollShiftPx(lenis: Lenis) {
	if (lenis.direction === 0) return 0;
	return (
		Math.min(Math.abs(lenis.velocity) * VELOCITY_SCALE, MAX_SHIFT_PX) *
		lenis.direction
	);
}

const About = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);
	const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
	const invalidateCanvas = useRef<(() => void) | null>(null);

	const x = useMotionValue("0%");
	const shift = useMotionValue(24);

	const isMD = useMediaQuery(SCREEN.md);

	useMotionValueEvent(x, "change", () => {
		invalidateCanvas.current?.();
	});

	useScrollEvent((lenis) => {
		if (isMD) {
			shift.set(scrollShiftPx(lenis));
		} else {
			shift.set(0);
		}

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

		const gridWidth = gridRef.current?.clientWidth;
		const windowWidth = window.innerWidth;

		if (!gridWidth || !windowWidth) return;

		const xValue = transform(
			progressValue,
			[0, 1],
			[0, (windowWidth - gridWidth) / gridWidth],
			{
				clamp: true,
			},
		);
		x.set(`${xValue * 100}%`);
	});

	return (
		<SubGrid className="pt-[5vw] border-primary relative">
			<SectionDescription className="row-start-1 col-start-6 col-span-2 md:col-span-1 md:col-start-7">
				I develop websites
			</SectionDescription>
			<div className="col-start-4 row-start-2 flex items-center justify-start mt-6">
				<PointerEventHandler asChild type="underline">
					<Link
						href="/projects"
						className="text-[min(max(5vw,16px),24px)] flex items-center justify-start gap-2 max-md:underline"
					>
						Projects
						<ArrowRightIcon
							className="w-[min(max(5vw,16px),24px)]"
							strokeWidth={1.5}
						/>
					</Link>
				</PointerEventHandler>
			</div>
			<div
				className="w-full col-span-full relative overflow-hidden -mx-2"
				ref={containerRef}
			>
				<Grid
					className="relative h-full py-[5vw] w-[200%] md:w-[120%] max-w-none px-2"
					asChild
				>
					<motion.div
						ref={gridRef}
						className="relative"
						style={{
							x,
						}}
					>
						{PROJECT_IMAGES.map(({ src, alt, className }, index) => (
							<div
								key={alt}
								ref={(element) => {
									cellRefs.current[index] = element;
								}}
								className={`relative w-full ${className}`}
								style={{
									aspectRatio: `${src.width} / ${src.height}`,
								}}
								// aria-hidden
							/>
						))}
						<WebGLPixelShiftCanvas
							className="absolute inset-0 pointer-events-none"
							images={PROJECT_IMAGES.map(({ src }) => src)}
							cellRefs={cellRefs}
							layoutRootRef={gridRef}
							shift={shift}
							invalidateRef={invalidateCanvas}
						/>
					</motion.div>
				</Grid>
			</div>
		</SubGrid>
	);
};

export default About;
