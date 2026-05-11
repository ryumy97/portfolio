import Link from "next/link";
import { Button } from "./ui/button";
import { Grid, SubGrid } from "./ui/grid";

const Header = () => {
	return (
		<>
			<Grid asChild>
				<header className="fixed top-0 left-0 right-0 z-50 p-2 grid grid-cols-10">
					<Button
						variant="nav"
						size={"text"}
						className="col-start-1 justify-start"
						asChild
					>
						<Link href="/">Ryumy</Link>
					</Button>
					<Button
						variant="nav"
						size={"text"}
						className="col-start-7 justify-start"
						asChild
					>
						<Link href="/about">About</Link>
					</Button>
					<Button
						variant="nav"
						size={"text"}
						className="col-start-8 justify-start"
						asChild
					>
						<Link href="/projects">Projects</Link>
					</Button>
					<Button
						variant="nav"
						size={"text"}
						className="col-start-9 justify-start"
						asChild
					>
						<Link href="/gallery">Gallery</Link>
					</Button>
					<Button
						variant="nav"
						size={"text"}
						className="col-start-10 justify-start"
						asChild
					>
						<Link href="/blogs">Blogs</Link>
					</Button>
				</header>
			</Grid>
			<SubGrid className="h-[33px]" />
		</>
	);
};

export default Header;
