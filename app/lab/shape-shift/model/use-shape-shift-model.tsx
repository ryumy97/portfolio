"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo, type ReactNode } from "react";
import {
	buildShapePositionSets,
	createDefaultShapeSources,
	MODEL_URLS,
	type ShapeKey,
} from "./shapes";

for (const url of MODEL_URLS) {
	useGLTF.preload(url);
}

export type ShapeShiftModel = {
	shapePositions: Float32Array[] | null;
};

export function useShapeShiftModel(count: number): ShapeShiftModel {
	const head = useGLTF(MODEL_URLS[0]);
	const eye = useGLTF(MODEL_URLS[1]);
	const hand = useGLTF(MODEL_URLS[2]);
	const phone = useGLTF(MODEL_URLS[3]);

	const shapePositions = useMemo(() => {
		const nodesByKey: Record<ShapeKey, typeof head.nodes> = {
			head: head.nodes,
			eye: eye.nodes,
			hand: hand.nodes,
			phone: phone.nodes,
		};

		return buildShapePositionSets(createDefaultShapeSources(nodesByKey), count);
	}, [count, eye.nodes, hand.nodes, head.nodes, phone.nodes]);

	return { shapePositions };
}

type ShapeShiftModelProviderProps = {
	count: number;
	children: (model: ShapeShiftModel) => ReactNode;
};

export function ShapeShiftModelProvider({
	count,
	children,
}: ShapeShiftModelProviderProps) {
	const model = useShapeShiftModel(count);
	return children(model);
}
