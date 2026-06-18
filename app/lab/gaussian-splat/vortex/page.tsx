"use client";

import { useCallback, useMemo, useState } from "react";
import { LabControlsGroup } from "@/app/lab/lab-controls-group";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import { CanvasLoader } from "@/components/canvas-loader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import {
	SAMPLE_SPLAT_METADATA_URL,
	SAMPLE_SPLAT_NAME,
	SAMPLE_SPLAT_URL,
} from "../assets";
import { VORTEX_DEFAULTS } from "./lib/viewer/vortexModifier";
import { GaussianSplatViewer } from "./view/gaussian-splat-viewer";

const VORTEX_CONTROLS = [
	{
		key: "fieldStrength",
		label: "Vortex strength",
		min: 0,
		max: 0.6,
		step: 0.01,
	},
	{
		key: "speed",
		label: "Vortex speed",
		min: 0,
		max: 6,
		step: 0.1,
	},
	{
		key: "frequencyScale",
		label: "Vortex detail",
		min: 0.5,
		max: 10,
		step: 0.1,
	},
	{
		key: "nearFieldStrength",
		label: "Near vortex",
		min: 0,
		max: 0.5,
		step: 0.01,
	},
] as const satisfies readonly LabNumericControlDef<
	"fieldStrength" | "speed" | "frequencyScale" | "nearFieldStrength"
>[];

const DEPTH_CONTROLS = [
	{
		key: "minDepthScale",
		label: "Far scale",
		min: 0,
		max: 0.5,
		step: 0.01,
	},
	{
		key: "farOpacity",
		label: "Far opacity",
		min: 0,
		max: 0.5,
		step: 0.01,
	},
	{
		key: "opacityPulse",
		label: "Shimmer",
		min: 0,
		max: 1,
		step: 0.01,
	},
	{
		key: "colorShift",
		label: "Cool tint",
		min: 0,
		max: 1,
		step: 0.01,
	},
] as const satisfies readonly LabNumericControlDef<
	"minDepthScale" | "farOpacity" | "opacityPulse" | "colorShift"
>[];

type VortexControlKey = (typeof VORTEX_CONTROLS)[number]["key"];
type DepthControlKey = (typeof DEPTH_CONTROLS)[number]["key"];

export default function GaussianSplatPage() {
	const [loading, setLoading] = useState(true);
	const [pointCloudMode, setPointCloudMode] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [vortexValues, setVortexValues] = useState<
		Record<VortexControlKey, number>
	>({
		fieldStrength: VORTEX_DEFAULTS.fieldStrength,
		speed: VORTEX_DEFAULTS.speed,
		frequencyScale: VORTEX_DEFAULTS.frequencyScale,
		nearFieldStrength: VORTEX_DEFAULTS.nearFieldStrength,
	});
	const [depthValues, setDepthValues] = useState<
		Record<DepthControlKey, number>
	>({
		minDepthScale: VORTEX_DEFAULTS.minDepthScale,
		farOpacity: VORTEX_DEFAULTS.farOpacity,
		opacityPulse: VORTEX_DEFAULTS.opacityPulse,
		colorShift: VORTEX_DEFAULTS.colorShift,
	});

	const vortexSettings = useMemo(
		() => ({ ...vortexValues, ...depthValues }),
		[vortexValues, depthValues],
	);

	const handleLoad = useCallback(() => {
		setLoading(false);
		setErrorMessage(null);
	}, []);

	const handleError = useCallback((error: Error) => {
		setLoading(false);
		setErrorMessage(error.message);
	}, []);

	const handleReload = useCallback(() => {
		setLoading(true);
		setErrorMessage(null);
		setReloadKey((key) => key + 1);
	}, []);

	return (
		<LabPageLayout
			title="Vortex"
			description="A planar vector field swirls splats in XY; scale, opacity, and color shift with camera distance."
			sidebar={
				<div className="flex flex-col gap-4">
					{errorMessage ? (
						<p className="text-xs text-destructive">{errorMessage}</p>
					) : null}
					<LabControlsGroup
						label="Vortex field"
						controls={VORTEX_CONTROLS}
						values={vortexValues}
						onValueChange={(key, value) =>
							setVortexValues((current) => ({ ...current, [key]: value }))
						}
					/>
					<LabControlsGroup
						label="Depth falloff"
						controls={DEPTH_CONTROLS}
						values={depthValues}
						onValueChange={(key, value) =>
							setDepthValues((current) => ({ ...current, [key]: value }))
						}
					/>
					<div className="flex items-center justify-between gap-3">
						<label
							htmlFor="gaussian-splat-point-cloud"
							className="text-sm text-muted-foreground"
						>
							Point cloud mode
						</label>
						<Switch
							id="gaussian-splat-point-cloud"
							checked={pointCloudMode}
							disabled={loading}
							onCheckedChange={setPointCloudMode}
						/>
					</div>
					<Button
						type="button"
						variant="outline"
						disabled={loading}
						onClick={handleReload}
					>
						Reload
					</Button>
				</div>
			}
		>
			<section
				aria-label="Gaussian splat viewer"
				className="absolute inset-0 h-full w-full"
			>
				<CanvasLoader active={loading} />
				<GaussianSplatViewer
					key={reloadKey}
					initialUrl={SAMPLE_SPLAT_URL}
					initialFileName={SAMPLE_SPLAT_NAME}
					initialMetadataUrl={SAMPLE_SPLAT_METADATA_URL}
					pointCloudMode={pointCloudMode}
					vortexSettings={vortexSettings}
					onLoad={handleLoad}
					onError={handleError}
				/>
			</section>
		</LabPageLayout>
	);
}
