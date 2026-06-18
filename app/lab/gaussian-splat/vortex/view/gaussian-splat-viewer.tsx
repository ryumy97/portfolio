"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { GaussianViewer } from "../lib/viewer/GaussianViewer";
import type { VortexSettings } from "../lib/viewer/vortexModifier";

export type GaussianSplatViewerHandle = {
	loadSogUrl: (
		url: string,
		fileName: string,
		metadataUrl?: string,
	) => Promise<void>;
	isLoaded: () => boolean;
};

type GaussianSplatViewerProps = {
	initialUrl?: string;
	initialFileName?: string;
	initialMetadataUrl?: string;
	pointCloudMode?: boolean;
	vortexSettings?: VortexSettings;
	onLoad?: () => void;
	onError?: (error: Error) => void;
};

export const GaussianSplatViewer = forwardRef<
	GaussianSplatViewerHandle,
	GaussianSplatViewerProps
>(function GaussianSplatViewer(
	{
		initialUrl,
		initialFileName,
		initialMetadataUrl,
		pointCloudMode = false,
		vortexSettings,
		onLoad,
		onError,
	},
	ref,
) {
	const frameRef = useRef<HTMLDivElement>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<GaussianViewer | null>(null);
	const onLoadRef = useRef(onLoad);
	const onErrorRef = useRef(onError);
	const initialUrlRef = useRef(initialUrl);
	const initialFileNameRef = useRef(initialFileName);
	const initialMetadataUrlRef = useRef(initialMetadataUrl);
	const pointCloudModeRef = useRef(pointCloudMode);
	const vortexSettingsRef = useRef(vortexSettings);

	onLoadRef.current = onLoad;
	onErrorRef.current = onError;
	initialUrlRef.current = initialUrl;
	initialFileNameRef.current = initialFileName;
	initialMetadataUrlRef.current = initialMetadataUrl;
	pointCloudModeRef.current = pointCloudMode;
	vortexSettingsRef.current = vortexSettings;

	useImperativeHandle(ref, () => ({
		loadSogUrl: (url, fileName, metadataUrl) => {
			if (!viewerRef.current) {
				return Promise.reject(new Error("Viewer is not ready"));
			}
			return viewerRef.current.loadSogUrl(url, fileName, metadataUrl);
		},
		isLoaded: () => viewerRef.current?.isLoaded() ?? false,
	}));

	useEffect(() => {
		const container = containerRef.current;
		const viewport = viewportRef.current;
		const frame = frameRef.current;

		if (!container || !viewport || !frame) return;

		const viewer = new GaussianViewer({
			container,
			viewport,
			frame,
			onLoad: () => onLoadRef.current?.(),
			onError: (error) => onErrorRef.current?.(error),
		});

		viewerRef.current = viewer;
		viewer.setPointCloudMode(pointCloudModeRef.current);
		if (vortexSettingsRef.current) {
			viewer.setVortexSettings(vortexSettingsRef.current);
		}

		const url = initialUrlRef.current;
		const fileName = initialFileNameRef.current;
		const metadataUrl = initialMetadataUrlRef.current;
		if (url && fileName) {
			void viewer.loadSogUrl(url, fileName, metadataUrl).catch((error) => {
				const err = error instanceof Error ? error : new Error(String(error));
				onErrorRef.current?.(err);
			});
		}

		return () => {
			viewer.dispose();
			viewerRef.current = null;
		};
	}, []);

	useEffect(() => {
		viewerRef.current?.setPointCloudMode(pointCloudMode);
	}, [pointCloudMode]);

	useEffect(() => {
		if (!vortexSettings) return;
		viewerRef.current?.setVortexSettings(vortexSettings);
	}, [vortexSettings]);

	return (
		<div
			ref={frameRef}
			className="relative flex h-full w-full items-center justify-center"
		>
			<div ref={viewportRef} className="relative h-full w-full shrink-0">
				<div ref={containerRef} className="h-full w-full [&_canvas]:block" />
			</div>
		</div>
	);
});
