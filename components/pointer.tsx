"use client";

import { cn } from "@/lib/utils";
import { lerp } from "@/lib/math";
import { pointer } from "@/stores/pointer";
import { useAnimationFrame } from "motion/react";
import { Slot } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { useScrollEvent } from "./smooth-scroll";

type PointerEventType = "bg" | "underline" | "bullet";
type PointerEventProps = {
	ref?: React.RefObject<HTMLElement | null>;
	type?: PointerEventType;
	offsetX?: number;
	offsetY?: number;
	borderRadius?: number;
	offsetWidth?: number;
	offsetHeight?: number;
};

const setHoverTarget = (values: {
	x: number;
	y: number;
	width: number;
	height: number;
	borderRadius: number;
}) => {
	pointer.hover = true;
	pointer.target.x = values.x;
	pointer.target.y = values.y;
	pointer.target.width = values.width;
	pointer.target.height = values.height;
	pointer.target.borderRadius = values.borderRadius;
};

export const usePointerEvent = ({
	ref,
	type = "bg",
	offsetX = 0,
	offsetY = 0,
	borderRadius = 9999,
	offsetWidth = 0,
	offsetHeight = 0,
}: PointerEventProps) => {
	const isHoveringRef = useRef(false);

	const updateHoverTarget = (rect: DOMRect) => {
		if (type === "underline") {
			setHoverTarget({
				width: rect.width + offsetWidth,
				height: 1 + offsetHeight,
				x: rect.x + offsetX + rect.width / 2 + 16,
				y: rect.y + offsetY + rect.height + 16,
				borderRadius,
			});
			return;
		}

		if (type === "bullet") {
			setHoverTarget({
				width: 12 + offsetWidth,
				height: 12 + offsetHeight,
				x: rect.x + offsetX + 16,
				y: rect.y + offsetY + rect.height / 2 + 16,
				borderRadius,
			});
			return;
		}

		setHoverTarget({
			width: rect.width + offsetWidth + 16,
			height: rect.height + offsetHeight,
			x: rect.x + offsetX + rect.width / 2 + 16,
			y: rect.y + offsetY + rect.height / 2 + 16,
			borderRadius,
		});
	};

	useScrollEvent(() => {
		if (!isHoveringRef.current) return;

		const rect = ref?.current?.getBoundingClientRect();
		if (!rect) return;

		updateHoverTarget(rect);
	});

	const onPointerEnter = (event: React.PointerEvent<HTMLElement>) => {
		isHoveringRef.current = true;
		updateHoverTarget(event.currentTarget.getBoundingClientRect());
	};

	const onPointerLeave = () => {
		pointer.hover = false;
		pointer.target.width = 12;
		pointer.target.height = 12;
		pointer.target.borderRadius = 9999;
		isHoveringRef.current = false;
	};

	return {
		onPointerEnter,
		onPointerLeave,
	};
};

export const PointerEventHandler = ({
	asChild,
	children,
	type = "bg",
	offsetX,
	offsetY,
	borderRadius,
	offsetWidth,
	offsetHeight,
	...props
}: {
	children?: React.ReactNode;
	asChild?: boolean;
	type?: PointerEventType;
} & PointerEventProps) => {
	const ref = useRef<HTMLDivElement | null>(null);

	const { onPointerEnter, onPointerLeave } = usePointerEvent({
		type,
		offsetX,
		offsetY,
		borderRadius,
		offsetWidth,
		offsetHeight,
		ref,
	});

	const Comp = asChild ? Slot.Root : "div";

	// biome-ignore lint/correctness/useExhaustiveDependencies: force cleanup
	useEffect(() => {
		return () => {
			onPointerLeave();
		};
	}, []);

	return (
		<Comp
			// @ts-ignore
			ref={ref}
			onPointerEnter={onPointerEnter}
			onPointerLeave={onPointerLeave}
			{...props}
		>
			{children}
		</Comp>
	);
};

const Pointer = () => {
	const ref = useRef<HTMLDivElement>(null);
	const [isTouch, setIsTouch] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(pointer: touch)");
		setIsTouch(mediaQuery.matches);

		const handleMediaQueryChange = (e: MediaQueryListEvent) => {
			setIsTouch(e.matches);
		};
		mediaQuery.addEventListener("change", handleMediaQueryChange);

		return () => {
			mediaQuery.removeEventListener("change", handleMediaQueryChange);
		};
	}, []);

	useEffect(() => {
		const handlePointerMove = (e: PointerEvent) => {
			if (pointer.hover) return;

			pointer.target.x = e.clientX;
			pointer.target.y = e.clientY;
		};

		window.addEventListener("pointermove", handlePointerMove);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
		};
	}, []);

	useAnimationFrame((_, delta) => {
		const t = delta / 1000 / 0.1;

		pointer.current.x = lerp(pointer.current.x, pointer.target.x, t);
		pointer.current.y = lerp(pointer.current.y, pointer.target.y, t);
		pointer.current.width = lerp(
			pointer.current.width,
			pointer.target.width,
			t,
		);
		pointer.current.height = lerp(
			pointer.current.height,
			pointer.target.height,
			t,
		);
		pointer.current.borderRadius = lerp(
			pointer.current.borderRadius,
			pointer.target.borderRadius,
			t,
		);

		const el = ref.current;
		if (!el) return;

		el.style.transform = `translate(${pointer.current.x}px, ${pointer.current.y}px) translate(-50%, -50%)`;
		el.style.width = `${pointer.current.width}px`;
		el.style.height = `${pointer.current.height}px`;
		el.style.borderRadius = `${pointer.current.borderRadius}px`;
	});

	if (isTouch) return;

	return (
		<div
			ref={ref}
			className={cn(
				"pointer-events-none fixed -top-4 -left-4 bg-primary rounded-full w-3 h-3 z-0 max-md:hidden",
			)}
		/>
	);
};

export default Pointer;
