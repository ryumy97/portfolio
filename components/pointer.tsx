"use client";

import usePointerStore from "@/stores/pointer";
import { motion, useSpring } from "motion/react";
import { Slot } from "radix-ui";
import { useEffect, useRef, useState } from "react";

export const PointerEventHandler = ({
	asChild,
	children,
}: {
	children?: React.ReactNode;
	asChild?: boolean;
}) => {
	const onPointerEnter = (event: React.PointerEvent<HTMLElement>) => {
		const rect = event.currentTarget.getBoundingClientRect();

		const width = rect.width + 8;
		const height = rect.height + 4;
		const x = rect.x + rect.width / 2;
		const y = rect.y + rect.height / 2;

		usePointerStore.getState().setHover({
			x,
			y,
			width,
			height,
			borderRadius: 9999,
		});
	};
	const onPointerLeave = (_event: React.PointerEvent<HTMLElement>) => {
		usePointerStore.getState().hoverOut();
	};

	const Comp = asChild ? Slot.Root : "div";

	return (
		<Comp onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
			{children}
		</Comp>
	);
};

const Pointer = () => {
	const hover = usePointerStore((state) => state.hover);

	const x = useSpring(0, {
		stiffness: 350,
		damping: 50,
	});
	const y = useSpring(0, {
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
			className="pointer-events-none fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full w-3 h-3 z-0"
		></motion.div>
	);
};

export default Pointer;
