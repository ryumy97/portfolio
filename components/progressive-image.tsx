"use client";

import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { MotionImage } from "@/components/motion-image";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "quality" | "placeholder" | "blurDataURL"> & {
	/**
	 * Quality for the final (full) image. Defaults to Next's default (75).
	 */
	quality?: number;
	/**
	 * Quality for the low-quality preloaded image.
	 */
	lqipQuality?: number;
	/**
	 * `sizes` for the low-quality image. Keeping this very small ensures the
	 * requested LQIP file is tiny.
	 */
	lqipSizes?: string;
	/**
	 * Additional class applied to the low-quality image element.
	 */
	lqipClassName?: string;
};

const DEFAULT_LQIP_SIZES = "32px";

export function ProgressiveImage({
	quality,
	lqipQuality = 10,
	lqipSizes = DEFAULT_LQIP_SIZES,
	lqipClassName,
	className,
	sizes,
	loading,
	fetchPriority,
	preload,
	onLoad,
	...props
}: Props) {
	const [isFullLoaded, setIsFullLoaded] = React.useState(false);
	const [isLqipLoaded, setIsLqipLoaded] = React.useState(false);

	const showLqip = !isFullLoaded;

	return (
		<>
			{isLqipLoaded && (
				<MotionImage
					src={props.src}
					alt={props.alt}
					fill={props.fill}
					width={props.width}
					height={props.height}
					quality={quality}
					sizes={sizes}
					loading={loading}
					fetchPriority={fetchPriority}
					preload={preload}
					className={cn("col-start-1 blur-xl row-start-1", className)}
					onLoad={(e) => {
						onLoad?.(e);
						setIsFullLoaded(true);
					}}
					initial={{
						"--tw-blur": "blur(24px)",
					}}
					animate={{
						"--tw-blur": isFullLoaded ? "blur(0px)" : "blur(24px)",
					}}
					transition={{ duration: 0.45 }}
				/>
			)}

			{showLqip && (
				<Image
					key="lqip"
					src={props.src}
					alt={props.alt}
					fill={props.fill}
					quality={lqipQuality}
					loading={loading}
					fetchPriority={fetchPriority}
					preload={preload}
					sizes={props.fill ? lqipSizes : undefined}
					width={
						typeof props.width === "number"
							? Math.min(64, Math.max(10, Math.round(props.width / 10)))
							: props.width
					}
					height={
						typeof props.height === "number"
							? Math.min(64, Math.max(10, Math.round(props.height / 10)))
							: props.height
					}
					className={cn(
						"absolute inset-0 z-10 pointer-events-none",
						className,
						"blur-xl",
						isLqipLoaded ? "opacity-100" : "opacity-0",
						lqipClassName,
					)}
					onLoad={() => {
						setIsLqipLoaded(true);
					}}
				/>
			)}
		</>
	);
}
