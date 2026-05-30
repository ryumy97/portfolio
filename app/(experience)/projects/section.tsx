"use client";

import {
	cubicBezier,
	motion,
	transform,
	useAnimationFrame,
	useMotionValue,
} from "motion/react";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { MotionImage } from "@/components/motion-image";
import { PointerEventHandler } from "@/components/pointer";
import { useScrollEvent } from "@/components/smooth-scroll";
import {
	PageDescription,
	PageLink,
	ProjectTitle,
} from "@/components/ui/typography";
import { lerp } from "@/lib/math";
import { cn } from "@/lib/utils";
import { useIntroStore } from "@/stores/intro";

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

	useScrollEvent((_lenis) => {
		const rect = ref.current?.getBoundingClientRect();
		if (!rect) return;

		dataRef.current.target.x = transform(
			transform(rect.left, [-rect.width, window.innerWidth], [1, 0], {
				clamp: true,
			}),
			[0, 1],
			[20, -20],
			{
				clamp: true,
			},
		);

		dataRef.current.target.height = transform(
			transform(rect.left, [window.innerWidth / 2, window.innerWidth], [1, 0], {
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

		dataRef.current.target.x = transform(
			transform(rect.left, [-rect.width, window.innerWidth], [1, 0], {
				clamp: true,
			}),
			[0, 1],
			[20, -20],
			{
				clamp: true,
			},
		);

		dataRef.current.target.height = transform(
			transform(rect.left, [window.innerWidth / 2, window.innerWidth], [1, 0], {
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

export const ListItemSection: React.FC<{
	link: string;
	title: React.ReactNode;
	image: StaticImageData;
	className?: string;
}> = ({ link, title, image, className }) => {
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
							scale: 1,
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

export const TextSection: React.FC<{
	text: string;
	link?: string;
	linkText?: string;
	className?: string;
}> = ({ text, link, linkText, className }) => {
	return (
		<div className={cn("md:max-w-[30vw] max-w-[100vw] w-[80vw]", className)}>
			<PageDescription className="w-full mt-[2.5vw] md:mt-[1vw] whitespace-pre-line">
				{text}
			</PageDescription>
			{link && (
				<PageLink className="mt-[0.5em]">
					<PointerEventHandler asChild type="underline">
						<Link href={link} target="_blank" className="text-secondary italic">
							{linkText || link}
						</Link>
					</PointerEventHandler>
				</PageLink>
			)}
		</div>
	);
};

function getImageType(image: StaticImageData) {
	const ratio = image.width / image.height;
	if (ratio > 1.5) {
		return "desktop";
	} else if (ratio <= 0.75) {
		return "mobile";
	} else {
		return "default";
	}
}

export const ImageSection: React.FC<{
	image: StaticImageData;
	type?: "desktop" | "mobile" | "default";
	className?: string;
}> = ({ image, type: typeProp, className }) => {
	const { height, x, ref } = useRevealMotionValues();

	const type: "desktop" | "mobile" | "default" =
		typeProp || getImageType(image);

	return (
		<motion.div
			style={{
				aspectRatio: image.width / image.height,
			}}
			ref={ref}
			className={cn(
				"w-[80vw] md:w-[30vw] text-center relative",
				{
					"w-[120vw] md:w-[60vw]": type === "desktop",
					"w-[60vw] md:w-[20vw]": type === "mobile",
					"w-[80vw] md:w-[40vw]": type === "default",
				},
				className,
			)}
		>
			<motion.div
				style={{
					height: height,
				}}
				className="w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
			>
				<MotionImage
					src={image}
					alt="Project"
					className="w-full h-full object-cover"
					style={{
						scale: 1,
						x,
					}}
				/>
			</motion.div>
		</motion.div>
	);
};
