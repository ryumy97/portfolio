"use client";

import { useCallback, useState } from "react";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import { CanvasLoader } from "@/components/canvas-loader";
import { Switch } from "@/components/ui/switch";
import {
	SAMPLE_SPLAT_METADATA_URL,
	SAMPLE_SPLAT_NAME,
	SAMPLE_SPLAT_URL,
} from "./assets";
import { GaussianSplatViewer } from "./view/gaussian-splat-viewer";

export default function GaussianSplatPage() {
	const [loading, setLoading] = useState(true);
	const [pointCloudMode, setPointCloudMode] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleLoad = useCallback(() => {
		setLoading(false);
		setErrorMessage(null);
	}, []);

	const handleError = useCallback((error: Error) => {
		setLoading(false);
		setErrorMessage(error.message);
	}, []);

	return (
		<LabPageLayout
			title="Gaussian Splat"
			description="Move the pointer to subtly tilt the scene."
			sidebar={
				<div className="flex flex-col gap-4">
					{errorMessage ? (
						<p className="text-xs text-destructive">{errorMessage}</p>
					) : null}
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
				</div>
			}
		>
			<section
				aria-label="Gaussian splat viewer"
				className="absolute inset-0 h-full w-full"
			>
				<CanvasLoader active={loading} />
				<GaussianSplatViewer
					initialUrl={SAMPLE_SPLAT_URL}
					initialFileName={SAMPLE_SPLAT_NAME}
					initialMetadataUrl={SAMPLE_SPLAT_METADATA_URL}
					pointCloudMode={pointCloudMode}
					onLoad={handleLoad}
					onError={handleError}
				/>
			</section>
		</LabPageLayout>
	);
}
