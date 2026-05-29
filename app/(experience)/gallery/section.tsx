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
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const useRevealMotionValues = () => {
	const state = useIntroStore((store) => store.state);
	const ref = useRef<HTMLDivElement>(null);

	const dataRef = useRef({
		target: {
			y: 100,
		},
		current: {
			y: 100,
		},
	});

	const y = useMotionValue("5%");

	useScrollEvent((lenis) => {
		const rect = ref.current?.getBoundingClientRect();
		if (!rect) return;

		dataRef.current.target.y = transform(
			transform(
				rect.left,
				[window.innerWidth * 0.75, window.innerWidth],
				[1, 0],
				{
					clamp: true,
				},
			),
			[0, 1],
			[100, 0],
			{
				clamp: true,
				ease: cubicBezier(0.3, 0, 0.3, 1),
			},
		);
	});

	useEffect(() => {
		const rect = ref.current?.getBoundingClientRect();
		if (!rect) return;

		dataRef.current.target.y = transform(
			transform(
				rect.left,
				[window.innerWidth * 0.75, window.innerWidth],
				[1, 0],
				{
					clamp: true,
				},
			),
			[0, 1],
			[100, 0],
			{
				clamp: true,
				ease: cubicBezier(0.3, 0, 0.3, 1),
			},
		);
	}, []);

	useAnimationFrame((_, delta) => {
		if (state === "start") return;

		const t = delta / 1000 / 0.3;

		dataRef.current.current.y = lerp(
			dataRef.current.current.y,
			dataRef.current.target.y,
			t,
		);

		y.set(`${dataRef.current.current.y}vh`);
	});

	return {
		y,
		ref,
	};
};

export const ListItemSection: React.FC<{
	link: string;
	title: React.ReactNode;
	image: string;
	className?: string;
}> = ({ link, title, image, className }) => {
	const { y, ref } = useRevealMotionValues();

	return (
		<div
			className={cn(
				"w-[50vw] md:w-[30vw] text-center relative mr-[40vw] md:mr-[30vw]",
				className,
			)}
		>
			<motion.div
				className="w-full absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 border-white overflow-hidden border-[0.5vw] aspect-landscape shadow-2xl"
				style={{ y }}
				ref={ref}
			>
				<Image src={image} alt="Gallery" fill />
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

export const ImageSection: React.FC<{
	image: string;
	alt: string;
	layout: "landscape" | "portrait";
	className?: string;
}> = ({ image, alt, layout, className }) => {
	const { y, ref } = useRevealMotionValues();

	return (
		<motion.div
			className={cn(
				"text-center relative mr-[10vw] md:mr-[10vw] border-white overflow-hidden border-[0.5vw] shadow-2xl",
				{
					"w-[90vw] md:w-[30vw] aspect-landscape": layout === "landscape",
					"w-[60vw] md:w-[20vw] aspect-portrait": layout === "portrait",
				},
				className,
			)}
			style={{ y }}
			ref={ref}
		>
			<Image src={image} alt={alt} fill />
		</motion.div>
	);
};
