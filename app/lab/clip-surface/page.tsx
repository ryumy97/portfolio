"use client";

import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { useRef, useState } from "react";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import { OozeDebugScene } from "@/components/three/clip-surface-scene";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import {
	createOozeDebugState,
	type OozeDebugState,
} from "@/lib/three/ooze-debug";

export default function Page() {
	const [debug, setDebug] = useState<OozeDebugState>(() =>
		createOozeDebugState(),
	);
	const debugRef = useRef(debug);
	debugRef.current = debug;

	return (
		<PageTunnelIn>
			<Grid className="fixed inset-0 h-full w-full">
				<div className="col-start-1 col-end-3 z-10 border-r relative pt-10 pl-2 overflow-y-auto bg-background/90">
					<PointerEventHandler asChild type="underline">
						<Button variant="ghost" size="nav" asChild>
							<Link href="/lab">Back</Link>
						</Button>
					</PointerEventHandler>
					<div className="pt-4 pr-2 pb-8">
						<h1 className="mb-4 text-[28px] leading-none font-heading font-bold">
							Clip surface
						</h1>
					</div>
				</div>
				<div className="col-start-3 col-end-11 h-full">
					<Canvas frameloop="always">
						<OozeDebugScene debugRef={debugRef} />
					</Canvas>
				</div>
			</Grid>
		</PageTunnelIn>
	);
}
