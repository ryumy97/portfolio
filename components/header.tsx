"use client";

import Link from "next/link";
import { PointerEventHandler } from "./pointer";
import { Button } from "./ui/button";
import { Grid, SubGrid } from "./ui/grid";

const Header = () => {
	return (
		<>
			<Grid asChild>
				<header className="fixed top-0 left-0 right-0 z-50 p-2 grid grid-cols-10">
					<div className="col-start-1 justify-start items-center">
						<PointerEventHandler asChild>
							<Button variant="nav" size={"text"} asChild>
								<Link href="/">Ryumy</Link>
							</Button>
						</PointerEventHandler>
					</div>
					<div className="col-start-7 justify-start items-center">
						<PointerEventHandler asChild>
							<Button variant="nav" size={"text"} asChild>
								<Link href="/about">About</Link>
							</Button>
						</PointerEventHandler>
					</div>

					<div className="col-start-8 justify-start items-center">
						<PointerEventHandler asChild>
							<Button variant="nav" size={"text"} asChild>
								<Link href="/projects">Projects</Link>
							</Button>
						</PointerEventHandler>
					</div>

					<div className="col-start-9 justify-start items-center">
						<PointerEventHandler asChild>
							<Button variant="nav" size={"text"} asChild>
								<Link href="/gallery">Gallery</Link>
							</Button>
						</PointerEventHandler>
					</div>

					<div className="col-start-10 justify-start items-center">
						<PointerEventHandler asChild>
							<Button variant="nav" size={"text"} asChild>
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
