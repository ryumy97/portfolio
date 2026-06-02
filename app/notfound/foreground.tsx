"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { SubGrid } from "@/components/ui/grid";

const Foreground = () => {
	return (
		<SubGrid className="col-start-2 col-end-10 content-start gap-6 relative z-10">
			<div className="col-span-full">
				<PointerEventHandler asChild type="underline">
					<Button variant="ghost" size={"nav"} asChild>
						<Link href="/">
							<ArrowLeftIcon className="w-[10vw] h-[10vw]" />
							Back to home
						</Link>
					</Button>
				</PointerEventHandler>
			</div>
		</SubGrid>
	);
};

export default Foreground;
