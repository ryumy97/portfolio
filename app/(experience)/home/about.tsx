"use client";

import eye2Image from "./assets/eye2.png";
import handImage from "./assets/hand.png";
import roomImage from "./assets/room.png";
import { ArrowRightIcon } from "lucide-react";
import { cubicBezier, motion, transform, useMotionValue } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { PointerEventHandler } from "../../../components/pointer";
import { useScrollEvent } from "../../../components/smooth-scroll";
import { SubGrid } from "../../../components/ui/grid";
import { WebGLPixelationCanvas } from "../../../components/webgl/webgl-pixelation-canvas";

const About = () => {
	const ref = useRef<HTMLDivElement>(null);

	const y1 = useMotionValue("-10%");
	const pixelSize1 = useMotionValue(64);
	const radius1 = useMotionValue(1);

	const y2 = useMotionValue("-10%");
	const pixelSize2 = useMotionValue(64);
	const radius2 = useMotionValue(1);

	const y3 = useMotionValue("-10%");
	const pixelSize3 = useMotionValue(64);
	const radius3 = useMotionValue(1);

	useScrollEvent(() => {
		const rect = ref.current?.getBoundingClientRect();

		if (!rect) return;

		const progressValue = transform(
			window.innerHeight - rect.top,
			[0, rect.height + window.innerHeight],
			[0, 1],
			{
				clamp: true,
			},
		);

		const y1Value = transform(progressValue, [0, 1], [-20, 20], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});
		y1.set(`${y1Value}%`);

		const y2Value = transform(progressValue, [0, 1], [-20, 20], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});
		y2.set(`${y2Value}%`);

		const y3Value = transform(progressValue, [0, 1], [-20, 20], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});
		y3.set(`${y3Value}%`);

		pixelSize1.set(
			transform(progressValue, [0, 0.8], [64, 8], {
				clamp: true,
				ease: cubicBezier(0.3, 0, 0, 1),
			}),
		);

		pixelSize2.set(
			transform(progressValue, [0.1, 0.9], [64, 8], {
				clamp: true,
				ease: cubicBezier(0.3, 0, 0, 1),
			}),
		);

		pixelSize3.set(
			transform(progressValue, [0.2, 1], [64, 8], {
				clamp: true,
				ease: cubicBezier(0.3, 0, 0, 1),
			}),
		);
	});

	return (
		<SubGrid className="border-t pt-[10vw] border-primary relative">
			<h1 className="text-[min(max(10vw,18px),32px)] font-heading font-bold leading-[0.8em] tracking-[-0.03em] col-start-1">
				In Ha Ryu
			</h1>
			<p className="text-[min(max(10vw,18px),32px)] row-start-2 col-start-2">
				I think, therefore I am.
			</p>
			<div className="col-start-6 row-start-3 flex items-center justify-start">
				<PointerEventHandler asChild type="underline">
					<Link
						href="/about"
						className="text-[min(max(8vw,16px),24px)] flex items-center justify-start gap-2"
					>
						About
						<ArrowRightIcon
							className="w-[min(max(8vw,16px),24px)]"
							strokeWidth={1.5}
						/>
					</Link>
				</PointerEventHandler>
			</div>
			<SubGrid className="col-span-full py-[5vw] relative" ref={ref}>
				<motion.div
					className="overflow-hidden col-start-3 relative"
					style={{
						aspectRatio: eye2Image.width / eye2Image.height,
						y: y1,
					}}
				>
					{/* <MotionImage src={eye2Image} alt="eye2" /> */}
					<WebGLPixelationCanvas
						className="absolute inset-0"
						radius={radius1}
						pixelSize={pixelSize1}
						image={eye2Image}
					/>
				</motion.div>

				<motion.div
					className="overflow-hidden col-start-4 col-span-2 row-start-3 relative"
					style={{
						aspectRatio: handImage.width / handImage.height,
						y: y2,
					}}
				>
					{/* <MotionImage src={handImage} alt="hand" /> */}
					<WebGLPixelationCanvas
						className="absolute inset-0"
						radius={radius2}
						pixelSize={pixelSize2}
						image={handImage}
					/>
				</motion.div>

				<motion.div
					className="overflow-hidden col-start-8 col-span-2 row-start-2 relative"
					style={{
						aspectRatio: roomImage.width / roomImage.height,
						y: y3,
					}}
				>
					{/* <MotionImage src={roomImage} alt="room" /> */}
					<WebGLPixelationCanvas
						className="absolute inset-0"
						radius={radius3}
						pixelSize={pixelSize3}
						image={roomImage}
					/>
				</motion.div>
			</SubGrid>
		</SubGrid>
	);
};

export default About;
