"use client";

import { cn } from "@/lib/utils";
import { useIntroStore } from "@/stores/intro";
import usePointerStore from "@/stores/pointer";
import { motion, useSpring } from "motion/react";
import { Slot } from "radix-ui";
import { useEffect, useRef, useState } from "react";

export const usePointerEvent = ({
	type = "bg",
	offsetX = 0,
	offsetY = 0,
	borderRadius = 9999,
	offsetWidth = 16,
	offsetHeight = 0,
}: {
	type?: "bg" | "underline";
	offsetX?: number;
	offsetY?: number;
	borderRadius?: number;
	offsetWidth?: number;
	offsetHeight?: number;
}) => {
	const onPointerEnter = (event: React.PointerEvent<HTMLElement>) => {
		const rect = event.currentTarget.getBoundingClientRect();

		if (type === "underline") {
			const width = rect.width + offsetWidth;
			const height = 1 + offsetHeight;
			const x = rect.x + offsetX + rect.width / 2 + 16;
			const y = rect.y + offsetY + rect.height + 16;

			usePointerStore.getState().setHover({
				x,
				y,
				width,
				height,
				borderRadius,
			});

			return;
		} else {
			const width = rect.width + offsetWidth;
			const height = rect.height + offsetHeight;
			const x = rect.x + offsetX + rect.width / 2 + 16;
			const y = rect.y + offsetY + rect.height / 2 + 16;

			usePointerStore.getState().setHover({
				x,
				y,
				width,
				height,
				borderRadius,
			});
		}
	};
	const onPointerLeave = (_event: React.PointerEvent<HTMLElement>) => {
		usePointerStore.getState().hoverOut();
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
}: {
	children?: React.ReactNode;
	asChild?: boolean;
	type?: "bg" | "underline";
}) => {
	const { onPointerEnter, onPointerLeave } = usePointerEvent({
		type,
	});

	const Comp = asChild ? Slot.Root : "div";

	return (
		<Comp onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
			{children}
		</Comp>
	);
};

const Pointer = () => {
	const state = useIntroStore((state) => state.state);
	const hover = usePointerStore((state) => state.hover);

	const x = useSpring(-12, {
		stiffness: 350,
		damping: 50,
	});
	const y = useSpring(-12, {
		stiffness: 350,
		damping: 50,
	});
	const width = useSpring(12, {
		stiffness: 350,
		damping: 50,
	});
	const height = useSpring(12, {
		stiffness: 350,
		damping: 50,
	});
	const borderRadius = useSpring(9999, {
		stiffness: 350,
		damping: 50,
	});

	const hoverEventEnabledRef = useRef(false);

	const [isTouch, setIsTouch] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(pointer: touch)");
		mediaQuery.matches ? setIsTouch(true) : setIsTouch(false);

		const handleMediaQueryChange = (e: MediaQueryListEvent) => {
			setIsTouch(e.matches);
		};
		mediaQuery.addEventListener("change", handleMediaQueryChange);

		return () => {
			mediaQuery.removeEventListener("change", handleMediaQueryChange);
		};
	}, []);

	useEffect(() => {
		if (hover) {
			hoverEventEnabledRef.current = true;

			x.set(hover.x);
			y.set(hover.y);
			width.set(hover.width);
			height.set(hover.height);
			borderRadius.set(hover.borderRadius);

			return () => {
				hoverEventEnabledRef.current = false;
				width.set(12);
				height.set(12);
				borderRadius.set(9999);
			};
		}

		const handlePointerMove = (e: PointerEvent) => {
			x.set(e.clientX);
			y.set(e.clientY);
		};

		window.addEventListener("pointermove", handlePointerMove);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
		};
	}, [hover, x, y, width, height, borderRadius]);

	if (isTouch) return;

	return (
		<motion.div
			style={{
				x,
				y,
				width,
				height,
				borderRadius,
			}}
			className={cn(
				"pointer-events-none fixed -top-4 -left-4 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full w-3 h-3 z-0",
			)}
		></motion.div>
	);
};

export default Pointer;
