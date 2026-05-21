"use client";

import { MotionImage } from "@/components/motion-image";
import { PointerEventHandler } from "@/components/pointer";
import { ArrowRightIcon } from "lucide-react";
import { motion, transform, useMotionValue } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { useScrollEvent } from "../../../components/smooth-scroll";
import { Grid, SubGrid } from "../../../components/ui/grid";
import Kiwi from "./assets/kiwi.png";
import Typography from "./assets/typography.png";
import Image from "next/image";
import AimHigh from "./assets/aimhigh.png";
import Reflct from "./assets/reflct.png";
import LiveOcean from "./assets/liveocean.png";
import Fola from "./assets/fola.png";

const About = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);

	const x = useMotionValue("0%");

	useScrollEvent(() => {
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
				className="w-full col-span-full relative overflow-hidden -mx-2"
				ref={containerRef}
			>
				<Grid
					className="relative h-full py-[5vw] w-[120%] max-w-none px-2"
					asChild
				>
					<motion.div
						ref={gridRef}
						style={{
							x,
						}}
					>
						<Image className="col-start-2 row-start-3" src={Kiwi} alt="Kiwi" />
						<Image
							className="col-start-4 row-start-1"
							src={Typography}
							alt="Typography"
						/>
						<Image
							className="col-start-6 col-span-2 row-start-2"
							src={AimHigh}
							alt="AimHigh"
						/>
						<Image
							className="col-start-8 col-span-2 row-start-4"
							src={Reflct}
							alt="Reflect"
						/>
						<Image
							className="col-start-4 col-span-2 row-start-3"
							src={LiveOcean}
							alt="LiveOcean"
						/>
						<Image
							className="col-start-7 col-span-2 row-start-1"
							src={Fola}
							alt="Fola"
						/>
					</motion.div>
				</Grid>
			</div>
		</SubGrid>
	);
};

export default About;
