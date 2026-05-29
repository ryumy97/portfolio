"use client";

import { cn } from "@/lib/utils";
import favicon from "@/public/favicon.png";
import { AnimatePresence, cubicBezier, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PointerEventHandler, usePointerEvent } from "./pointer";
import { Button } from "./ui/button";
import { Grid } from "./ui/grid";

const Logo = () => {
	const pathname = usePathname();
	const [hover, setHover] = useState(false);

	const { onPointerEnter, onPointerLeave } = usePointerEvent({
		offsetX: 26,
		offsetY: 2,
		offsetWidth: 8,
	});

	return (
		<div className="relative col-start-1 justify-start items-center">
			<Button
				variant={pathname === "/" ? "navActive" : "nav"}
				size={"nav"}
				asChild
				onPointerEnter={(event) => {
					onPointerEnter(event);
					setHover(true);
				}}
				onPointerLeave={(event) => {
					onPointerLeave(event);
					setHover(false);
				}}
				className=" no-underline"
			>
				<Link
					className={cn("relative transition-all duration-300", {
						"pl-[32px]": hover,
					})}
					href="/"
				>
					<Image
						src={favicon}
						alt="Ryumy"
						className={cn(
							"absolute top-1/2 -translate-y-1/2 left-0 w-[28px] h-[28px] transition-all duration-300",
							{
								"translate-x-0 rotate-0": hover,
							},
							{
								"translate-x-[-150%] -rotate-180": !hover,
							},
						)}
					/>
					Ryumy
				</Link>
			</Button>
		</div>
	);
};

const Header = () => {
	const pathname = usePathname();

	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Grid asChild>
				<header className="fixed top-0 left-0 right-0 z-50 p-2 grid grid-cols-10">
					<Logo />

					<div className="col-start-10 md:hidden">
						<Button
							variant="nav"
							size={"nav"}
							onClick={() => setIsOpen(!isOpen)}
						>
							{isOpen ? "Close" : "Menu"}
						</Button>
					</div>

					<div className="col-start-7 flex justify-end items-center max-md:hidden">
						<PointerEventHandler asChild>
							<Button
								variant={pathname === "/about" ? "navActive" : "nav"}
								size={"nav"}
								asChild
							>
								<Link href="/about">About</Link>
							</Button>
						</PointerEventHandler>
					</div>

					<div className="col-start-8 flex justify-end items-center max-md:hidden">
						<PointerEventHandler asChild>
							<Button
								variant={pathname === "/projects" ? "navActive" : "nav"}
								size={"nav"}
								asChild
							>
								<Link href="/projects">Projects</Link>
							</Button>
						</PointerEventHandler>
					</div>

					<div className="col-start-9 flex justify-end items-center max-md:hidden">
						<PointerEventHandler asChild>
							<Button
								variant={pathname === "/gallery" ? "navActive" : "nav"}
								size={"nav"}
								asChild
							>
								<Link href="/gallery">Gallery</Link>
							</Button>
						</PointerEventHandler>
					</div>
					<div className="col-start-10 flex justify-end items-center max-md:hidden">
						<PointerEventHandler asChild>
							<Button
								variant={pathname === "/gallery" ? "navActive" : "nav"}
								size={"nav"}
								asChild
							>
								<Link href="/lab">Lab</Link>
							</Button>
						</PointerEventHandler>
					</div>
				</header>
			</Grid>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						key={"header-modal"}
						className="fixed top-0 left-0 right-0 z-49 p-2 flex flex-col gap-2 bg-popover items-center justify-center overflow-hidden"
						initial={"hidden"}
						animate={"visible"}
						exit={"hidden"}
						variants={{
							hidden: { height: 0 },
							visible: { height: "100vh" },
						}}
						transition={{ duration: 0.6, ease: cubicBezier(0.3, 0, 0, 1) }}
					>
						<motion.div
							className="w-full text-center"
							variants={{
								hidden: { opacity: 0, y: -100 },
								visible: {
									opacity: 1,
									y: 0,
									transition: {
										delay: 0.2,
										duration: 1,
										ease: cubicBezier(0.3, 0, 0, 1),
									},
								},
							}}
							transition={{ duration: 0.3, ease: cubicBezier(0.3, 0, 0, 1) }}
						>
							<Link
								href="/"
								className={cn("w-full font-heading text-[8vw] no-underline", {
									"text-primary": pathname === "/",
								})}
							>
								Home
							</Link>
						</motion.div>
						<motion.div
							className="w-full text-center"
							variants={{
								hidden: { opacity: 0, y: -100 },
								visible: {
									opacity: 1,
									y: 0,
									transition: {
										delay: 0.3,
										duration: 1,
										ease: cubicBezier(0.3, 0, 0, 1),
									},
								},
							}}
							transition={{ duration: 0.3, ease: cubicBezier(0.3, 0, 0, 1) }}
						>
							<Link
								href="/about"
								className={cn("w-full font-heading text-[8vw] no-underline", {
									"text-primary": pathname === "/about",
								})}
							>
								About
							</Link>
						</motion.div>
						<motion.div
							className="w-full text-center"
							variants={{
								hidden: { opacity: 0, y: -100 },
								visible: {
									opacity: 1,
									y: 0,
									transition: {
										delay: 0.4,
										duration: 1,
										ease: cubicBezier(0.3, 0, 0, 1),
									},
								},
							}}
							transition={{ duration: 0.3, ease: cubicBezier(0.3, 0, 0, 1) }}
						>
							<Link
								href="/projects"
								className={cn("w-full font-heading text-[8vw] no-underline", {
									"text-primary": pathname === "/projects",
								})}
							>
								Projects
							</Link>
						</motion.div>
						<motion.div
							className="w-full text-center"
							variants={{
								hidden: { opacity: 0, y: -100 },
								visible: {
									opacity: 1,
									y: 0,
									transition: {
										delay: 0.5,
										duration: 1,
										ease: cubicBezier(0.3, 0, 0, 1),
									},
								},
							}}
							transition={{ duration: 0.3, ease: cubicBezier(0.3, 0, 0, 1) }}
						>
							<Link
								href="/gallery"
								className={cn("w-full font-heading text-[8vw] no-underline", {
									"text-primary": pathname === "/gallery",
								})}
							>
								Gallery
							</Link>
						</motion.div>
						<motion.div
							className="w-full text-center"
							variants={{
								hidden: { opacity: 0, y: -100 },
								visible: {
									opacity: 1,
									y: 0,
									transition: {
										delay: 0.6,
										duration: 1,
										ease: cubicBezier(0.3, 0, 0, 1),
									},
								},
							}}
							transition={{ duration: 0.3, ease: cubicBezier(0.3, 0, 0, 1) }}
						>
							<Link
								href="/lab"
								className={cn("w-full font-heading text-[8vw] no-underline", {
									"text-primary": pathname === "/lab",
								})}
							>
								Lab
							</Link>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default Header;
