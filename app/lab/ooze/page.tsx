"use client";

import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { useRef, useState } from "react";
import { PageTunnelIn } from "@/components/page-tunnel";
import { OozeDebugPanel } from "@/components/three/ooze-debug-panel";
import { OozeDebugScene } from "@/components/three/ooze-debug-scene";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import {
	createOozeDebugState,
	type OozeDebugState,
} from "@/lib/three/ooze-debug";

export default function OozeLabPage() {
	const [debug, setDebug] = useState<OozeDebugState>(() => createOozeDebugState());
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
							Ooze surface
						</h1>
						<OozeDebugPanel values={debug} onChange={setDebug} />
					</div>
				</div>
				<div className="col-start-3 col-end-11 h-full">
					<Canvas frameloop="always" style={{ background: "#f9f8f5" }}>
						<color attach="background" args={["#f9f8f5"]} />
						<OozeDebugScene debugRef={debugRef} />
					</Canvas>
				</div>
			</Grid>
		</PageTunnelIn>
	);
}
