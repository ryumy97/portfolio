"use client";

import { PointerEventHandler } from "@/components/pointer";
import { useLenis } from "lenis/react";
import { cubicBezier, transform, useMotionValue } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { useScrollEvent } from "../../../components/smooth-scroll";
import { Grid, SubGrid } from "../../../components/ui/grid";
import { MotionImage } from "@/components/motion-image";
import Kiwi from "./assets/kiwi.png";
import Typography from "./assets/typography.png";

const About = () => {
	const lenis = useLenis();
	const ref = useRef<HTMLDivElement>(null);

	const width = useMotionValue("50%");
	const opacity = useMotionValue(1);

	const pixelSize = useMotionValue(64);
	const radius = useMotionValue(1);

	useScrollEvent(() => {
		const top = ref.current?.getBoundingClientRect().top ?? 0;
		const progress = (window.innerHeight - top) / window.innerHeight;

		// width
		const w = transform(progress, [0, 1], [50, 100], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});
		width.set(`${w}%`);

		// opacity
		const op = transform(progress, [0, 1], [1, 0], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});

		opacity.set(op);

		// pixel size
		const px = transform(progress, [0, 1], [64, 24], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});

		pixelSize.set(px);

		// radius
		radius.set(1);
	});

	return (
		<SubGrid className="pt-[5vw] border-primary relative">
			<p className="row-start-1 col-start-7 text-[min(max(10vw,18px),32px)]">
				I develop websites
			</p>
			<div className="w-full col-span-full aspect-video flex items-center justify-center relative">
				<Grid className="absolute inset-0">
					<MotionImage
						className="col-start-2 row-start-2"
						src={Kiwi}
						alt="Kiwi"
					/>
					<MotionImage
						className="col-start-4 row-start-1"
						src={Typography}
						alt="Typography"
					/>
				</Grid>
				<PointerEventHandler asChild type="underline">
					<Link
						href="/projects"
						className="text-[8vw] flex items-center justify-start gap-2 font-heading font-bold relative z-10"
					>
						Projects
					</Link>
				</PointerEventHandler>
				{/* <Image className="col-start-2 row-start-2" src={Kiwi} alt="Kiwi" />
				<Image
					className=" col-start-3 row-start-3"
					src={Typography}
					alt="Typography"
				/> */}
			</div>
		</SubGrid>
	);
};

export default About;
