"use client";

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
import { PointerEventHandler } from "@/components/pointer";
import { WebGLGridRedshiftCanvas } from "@/components/webgl/webgl-grid-redshift-canvas";
import { useScrollEvent } from "../../../components/smooth-scroll";
import { Grid, SubGrid } from "../../../components/ui/grid";
import AimHigh from "./assets/aimhigh.png";
import Fola from "./assets/fola.png";
import Kiwi from "./assets/kiwi.png";
import LiveOcean from "./assets/liveocean.png";
import Reflct from "./assets/reflct.png";
import Typography from "./assets/typography.png";

const MAX_SHIFT_PX = 48;
const VELOCITY_SCALE = 0.1;

type ProjectImage = {
	src: StaticImageData;
	alt: string;
	className: string;
};

const PROJECT_IMAGES: ProjectImage[] = [
	{ src: Kiwi, alt: "Kiwi", className: "col-start-2 row-start-3" },
	{
		src: Typography,
		alt: "Typography",
		className: "col-start-4 row-start-1",
	},
	{
		src: AimHigh,
		alt: "AimHigh",
		className: "col-start-6 col-span-2 row-start-2",
	},
	{
		src: Reflct,
		alt: "Reflect",
		className: "col-start-8 col-span-2 row-start-4",
	},
	{
		src: LiveOcean,
		alt: "LiveOcean",
		className: "col-start-4 col-span-2 row-start-3",
	},
	{
		src: Fola,
		alt: "Fola",
		className: "col-start-7 col-span-2 row-start-1",
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

	useMotionValueEvent(x, "change", () => {
		invalidateCanvas.current?.();
	});

	useScrollEvent((lenis) => {
		shift.set(scrollShiftPx(lenis));

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
			<p className="row-start-1 col-start-7 text-[min(max(10vw,18px),32px)]">
				I develop websites
			</p>
			<div className="col-start-4 row-start-2 flex items-center justify-start mt-6">
				<PointerEventHandler asChild type="underline">
					<Link
						href="/projects"
						className="text-[min(max(8vw,16px),24px)] flex items-center justify-start gap-2"
					>
						Projects
						<ArrowRightIcon
							className="w-[min(max(8vw,16px),24px)]"
							strokeWidth={1.5}
						/>
					</Link>
				</PointerEventHandler>
			</div>
			<div
				className="w-full col-span-full relative overflow-visible -mx-2"
				ref={containerRef}
			>
				<Grid
					className="relative h-full py-[5vw] w-[120%] max-w-none px-2"
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
						<WebGLGridRedshiftCanvas
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
