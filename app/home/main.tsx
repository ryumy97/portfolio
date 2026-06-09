"use client";

import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { useRef } from "react";
import { usePointerEvent } from "@/components/pointer";
import MainScene from "@/components/three/scene/main-scene";
import { SubGrid } from "@/components/ui/grid";
import { Title } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { usePartHoverStore } from "@/stores/part-hover";

const Main = () => {
	const ref = useRef<HTMLDivElement>(null);
	const sectionRef = useRef<HTMLDivElement>(null);

	const { phone, hand, eye, head } = usePartHoverStore();

	const headRef = useRef<HTMLDivElement>(null);
	const {
		onPointerEnter: onHeadPointerEnter,
		onPointerLeave: onHeadPointerLeave,
	} = usePointerEvent({
		ref: headRef,
		type: "underline",
		offsetY: 12,
	});

	const eyeRef = useRef<HTMLDivElement>(null);
	const {
		onPointerEnter: onEyePointerEnter,
		onPointerLeave: onEyePointerLeave,
	} = usePointerEvent({
		ref: eyeRef,
		type: "underline",
		offsetY: 12,
	});

	const projectsRef = useRef<HTMLDivElement>(null);
	const {
		onPointerEnter: onProjectsPointerEnter,
		onPointerLeave: onProjectsPointerLeave,
	} = usePointerEvent({
		ref: projectsRef,
		type: "underline",
		offsetY: 12,
	});

	const labRef = useRef<HTMLDivElement>(null);
	const {
		onPointerEnter: onLabPointerEnter,
		onPointerLeave: onLabPointerLeave,
	} = usePointerEvent({
		ref: labRef,
		type: "underline",
		offsetY: 12,
	});

	return (
		<SubGrid
			className="relative w-full my-[10vh] aspect-9/16 md:aspect-video overflow-hidden"
			ref={sectionRef}
		>
			<div ref={ref} className="absolute top-0 left-0 right-0 h-full">
				<Canvas eventSource={ref.current ?? undefined} frameloop={"demand"}>
					<MainScene sectionRef={sectionRef} />
				</Canvas>
			</div>
			{/* Mobile */}
			<Link
				href="/about"
				className="absolute top-[25vw] left-[56vw] -translate-x-1/2 -translate-y-1/2 md:hidden"
			>
				<Title>
					<span>About</span>
				</Title>
			</Link>
			<Link
				href="/gallery"
				className="absolute top-[84vw] right-[38vw] -translate-x-1/2 -translate-y-1/2 md:hidden"
			>
				<Title>
					<span>Gallery</span>
				</Title>
			</Link>
			<Link
				href="/projects"
				className="absolute top-[130vw] left-[40vw] -translate-x-1/2 -translate-y-1/2 md:hidden"
			>
				<Title>
					<span>Projects</span>
				</Title>
			</Link>
			<Link
				href="/lab"
				className="absolute top-[150vw] right-[15vw] -translate-x-1/2 -translate-y-1/2 md:hidden"
			>
				<Title>
					<span>Lab</span>
				</Title>
			</Link>

			{/* Desktop */}
			<Link
				href="/about"
				className="absolute top-[13vw] left-[30vw] translate-x-[-50%] translate-y-[-50%] w-[15vw] h-[15vw] max-md:hidden cursor-pointer"
				onPointerEnter={() => {
					onHeadPointerEnter();
					usePartHoverStore.getState().setHeadHover(true);
				}}
				onPointerLeave={() => {
					onHeadPointerLeave();
					usePartHoverStore.getState().setHeadHover(false);
				}}
			>
				<Title
					className={cn(
						"absolute top-1/2 right-0 translate-x-[100%] -translate-y-1/2 transition-opacity duration-300 ease-[cubic-bezier(0.3,0,0,1)]",
						{
							"opacity-0": !head,
							"opacity-100": head,
						},
					)}
				>
					<span ref={headRef} className="flex items-center justify-start">
						About
					</span>
				</Title>
			</Link>

			<Link
				href="/gallery"
				className="absolute top-[29vw] left-[71vw] translate-x-[-50%] translate-y-[-50%] w-[8vw] h-[8vw] max-md:hidden cursor-pointer"
				onPointerEnter={() => {
					onEyePointerEnter();
					usePartHoverStore.getState().setEyeHover(true);
				}}
				onPointerLeave={() => {
					onEyePointerLeave();
					usePartHoverStore.getState().setEyeHover(false);
				}}
			>
				<Title
					className={cn(
						"absolute top-1/2 left-0 translate-x-[-100%] -translate-y-1/2 transition-opacity duration-300 ease-[cubic-bezier(0.3,0,0,1)]",
						{
							"md:opacity-0": !eye,
							"md:opacity-100": eye,
						},
					)}
				>
					<span ref={eyeRef} className="flex items-center justify-start">
						Gallery
					</span>
				</Title>
			</Link>

			<Link
				href="/projects"
				className="absolute top-[39vw] left-[42vw] translate-x-[-50%] translate-y-[-50%] w-[9vw] h-[9vw] max-md:hidden cursor-pointer"
				onPointerEnter={() => {
					onProjectsPointerEnter();
					usePartHoverStore.getState().setHandHover(true);
				}}
				onPointerLeave={() => {
					onProjectsPointerLeave();
					usePartHoverStore.getState().setHandHover(false);
				}}
			>
				<Title
					className={cn(
						"absolute top-1/2 left-0 translate-x-[-100%] -translate-y-1/2 opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.3,0,0,1)]",
						{
							"md:opacity-0": !hand,
							"md:opacity-100": hand,
						},
					)}
				>
					<span ref={projectsRef} className="flex items-center justify-start">
						Projects
					</span>
				</Title>
			</Link>

			<Link
				href="/lab"
				className="absolute top-[46vw] left-[63vw] translate-x-[-50%] translate-y-[-50%] w-[10vw] h-[10vw] max-md:hidden cursor-pointer"
				onPointerEnter={() => {
					onLabPointerEnter();
					usePartHoverStore.getState().setPhoneHover(true);
				}}
				onPointerLeave={() => {
					onLabPointerLeave();
					usePartHoverStore.getState().setPhoneHover(false);
				}}
			>
				<Title
					className={cn(
						"absolute top-1/2 right-0 translate-x-[100%] -translate-y-1/2 transition-opacity duration-300 ease-[cubic-bezier(0.3,0,0,1)]",
						{
							"md:opacity-0": !phone,
							"md:opacity-100": phone,
						},
					)}
				>
					<span ref={labRef} className="flex items-center justify-start">
						Lab
					</span>
				</Title>
			</Link>
		</SubGrid>
	);
};

export default Main;
