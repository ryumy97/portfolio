"use client";

import { Canvas } from "@react-three/fiber";
import { useRef, useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import { STAGGED_SCENE_DEFAULTS, StaggedScene } from "./scene";

const CONTROLS = [
	{ key: "pixelSize", label: "Pixel size", min: 4, max: 128, step: 1 },
	{ key: "maskStagger", label: "Mask stagger", min: 0, max: 1, step: 0.01 },
	{ key: "granularity", label: "Granularity", min: 1, max: 30, step: 1 },
] as const satisfies readonly LabNumericControlDef[];

type ControlKey = (typeof CONTROLS)[number]["key"];

export default function Home() {
	const eventSourceRef = useRef<HTMLDivElement>(null);
	const [values, setValues] = useState<Record<ControlKey, number>>({
		pixelSize: STAGGED_SCENE_DEFAULTS.pixelSize,
		maskStagger: STAGGED_SCENE_DEFAULTS.maskStagger,
		granularity: STAGGED_SCENE_DEFAULTS.granularity,
	});

	return (
		<LabPageLayout
			title="Staggered"
			sidebar={
				<LabNumericControls
					controls={CONTROLS}
					values={values}
					onValueChange={(key, value) =>
						setValues((current) => ({ ...current, [key]: value }))
					}
				/>
			}
		>
			<div ref={eventSourceRef} className="absolute inset-0 h-full w-full">
				<Canvas
					className="absolute inset-0 h-full w-full"
					eventSource={eventSourceRef.current ?? undefined}
					frameloop="always"
				>
					<StaggedScene
						pixelSize={values.pixelSize}
						maskStagger={values.maskStagger}
						granularity={values.granularity}
					/>
				</Canvas>
			</div>
		</LabPageLayout>
	);
}
