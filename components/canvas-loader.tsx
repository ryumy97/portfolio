"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CanvasLoaderProps = {
	active?: boolean;
	className?: string;
};

export function CanvasLoader({ active = false, className }: CanvasLoaderProps) {
	if (!active) return null;

	return (
		<div
			className={cn(
				"absolute inset-0 z-10 flex items-center justify-center",
				className,
			)}
			aria-live="polite"
			aria-busy={true}
		>
			<Loader2 className="h-5 w-5 animate-spin text-primary" role="status" />
		</div>
	);
}
