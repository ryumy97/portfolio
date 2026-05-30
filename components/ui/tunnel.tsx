"use client";

import { AnimatePresence, type AnimatePresenceProps } from "motion/react";
import type React from "react";
import { type ReactNode, useEffect } from "react";
import { create, type StoreApi } from "zustand";

type Props = { children: React.ReactNode };

type State = {
	current: Array<React.ReactNode>;
	version: number;
	set: StoreApi<State>["setState"];
};

export default function tunnel() {
	const useStore = create<State>((set) => ({
		current: [] as ReactNode[],
		version: 0,
		set,
	}));

	return {
		In: ({ children }: Props) => {
			const set = useStore((state) => state.set);
			const version = useStore((state) => state.version);

			/* When this component mounts, we increase the store's version number.
      This will cause all existing rats to re-render (just like if the Out component
      were mapping items to a list.) The re-rendering will cause the final 
      order of rendered components to match what the user is expecting. */

			// biome-ignore lint/correctness/useExhaustiveDependencies: version should update
			useEffect(() => {
				set((state) => ({
					version: state.version + 1,
				}));
			}, []);

			/* Any time the children _or_ the store's version number change, insert
      the specified React children into the list of rats. */
			// biome-ignore lint/correctness/useExhaustiveDependencies: version should make and update
			useEffect(() => {
				set(({ current }) => ({
					current: [...current, children],
				}));

				return () =>
					set(({ current }) => ({
						current: current.filter((c) => c !== children),
					}));
			}, [children, version]);

			return null;
		},

		Out: () => {
			const current = useStore((state) => state.current);
			return <>{current}</>;
		},
		OutAnimatePresence: (props: AnimatePresenceProps) => {
			const current = useStore((state) => state.current);
			return <AnimatePresence {...props}>{current}</AnimatePresence>;
		},
	};
}
