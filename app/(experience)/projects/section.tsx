"use client";

import { MotionImage } from "@/components/motion-image";
import { PointerEventHandler } from "@/components/pointer";
import { useScrollEvent } from "@/components/smooth-scroll";
import { ProjectTitle } from "@/components/ui/typography";
import { lerp } from "@/lib/math";
import { cn } from "@/lib/utils";
import { useIntroStore } from "@/stores/intro";
import {
	cubicBezier,
	motion,
	transform,
	useAnimationFrame,
	useMotionValue,
} from "motion/react";
import { StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

type Props = {
	link: string;
	title: React.ReactNode;
	image: StaticImageData;
	className?: string;
};

const useRevealMotionValues = () => {
	const state = useIntroStore((store) => store.state);
	const ref = useRef<HTMLDivElement>(null);

	const dataRef = useRef({
		target: {
			x: -5,
			height: 0,
		},
		current: {
			x: -5,
			height: 0,
		},
	});

	const height = useMotionValue("0%");
	const x = useMotionValue("-5%");

	useScrollEvent((lenis) => {
		const rect = ref.current?.getBoundingClientRect();
		if (!rect) return;

		const left = (rect.left - window.innerWidth) / window.innerWidth;

		dataRef.current.target.x = transform(
			transform(left, [0, -1], [0, 1], {
				clamp: true,
			}),
			[0, 1],
			[5, -5],
			{
				clamp: true,
			},
		);

		dataRef.current.target.height = transform(
			transform(left, [0, -0.7], [0, 1], {
				clamp: true,
			}),
			[0, 1],
			[0, 100],
			{
				clamp: true,
				ease: cubicBezier(0.3, 0, 0.3, 1),
			},
		);
	});

	useEffect(() => {
		const rect = ref.current?.getBoundingClientRect();
		if (!rect) return;

		const left = (rect.left - window.innerWidth) / window.innerWidth;

		dataRef.current.target.x = transform(
			transform(left, [0, -1], [0, 1], {
				clamp: true,
			}),
			[0, 1],
			[5, -5],
			{
				clamp: true,
			},
		);

		dataRef.current.target.height = transform(
			transform(left, [0, -0.7], [0, 1], {
				clamp: true,
			}),
			[0, 1],
			[0, 100],
			{
				clamp: true,
				ease: cubicBezier(0.3, 0, 0.3, 1),
			},
		);
	}, []);

	useAnimationFrame((_, delta) => {
		if (state === "start") return;

		const t = delta / 1000 / 0.3;

		dataRef.current.current.x = lerp(
			dataRef.current.current.x,
			dataRef.current.target.x,
			t,
		);
		dataRef.current.current.height = lerp(
			dataRef.current.current.height,
			dataRef.current.target.height,
			t,
		);

		x.set(`${dataRef.current.current.x}%`);
		height.set(`${dataRef.current.current.height}%`);
	});

	return {
		height,
		x,
		ref,
	};
};

export const ListItemSection: React.FC<Props> = ({
	link,
	title,
	image,
	className,
}) => {
	const { height, x, ref } = useRevealMotionValues();

	return (
		<div
			className={cn(
				"w-[50vw] md:w-[30vw] text-center relative mr-[40vw] md:mr-[30vw]",
				className,
			)}
		>
			<motion.div
				style={{
					aspectRatio: image.width / image.height,
				}}
				ref={ref}
				className="w-full absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
			>
				<motion.div
					style={{
						height: height,
					}}
					className="w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
				>
					<MotionImage
						src={image}
						alt={typeof title === "string" ? title : "Project"}
						className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-100"
						style={{
							scale: 1.1,
							x,
						}}
					/>
				</motion.div>
			</motion.div>
			<ProjectTitle className="relative">
				<PointerEventHandler asChild type="underline" offsetHeight={2}>
					<Link
						href={link}
						className="bg-white/24 backdrop-blur-3xl drop-shadow-2xl"
					>
						{title}
					</Link>
				</PointerEventHandler>
			</ProjectTitle>
		</div>
	);
};
