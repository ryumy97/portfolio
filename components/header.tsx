"use client";

import Link from "next/link";
import { PointerEventHandler, usePointerEvent } from "./pointer";
import { Button } from "./ui/button";
import { Grid, SubGrid } from "./ui/grid";
import { usePathname } from "next/navigation";
import Image from "next/image";
import favicon from "@/public/favicon.png";
import { useState } from "react";
import { cn } from "@/lib/utils";

const Logo = () => {
	const pathname = usePathname();
	const [hover, setHover] = useState(false);

	const { onPointerEnter, onPointerLeave } = usePointerEvent({
		offsetX: 18,
		offsetWidth: 36,
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
							"absolute top-0 left-0 w-[28px] h-[28px] transition-all duration-300",
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

	return (
		<>
			<Grid asChild>
				<header className="fixed top-0 left-0 right-0 z-50 p-2 grid grid-cols-10">
					<Logo />
					<div className="col-start-7 justify-start items-center">
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

					<div className="col-start-8 justify-start items-center">
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

					<div className="col-start-9 justify-start items-center">
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

					<div className="col-start-10 justify-start items-center">
						<PointerEventHandler asChild>
							<Button
								variant={pathname === "/blogs" ? "navActive" : "nav"}
								size={"nav"}
								asChild
							>
								<Link href="/blogs">Blogs</Link>
							</Button>
						</PointerEventHandler>
					</div>
				</header>
			</Grid>
			<SubGrid className="h-[33px]" />
		</>
	);
};

export default Header;
