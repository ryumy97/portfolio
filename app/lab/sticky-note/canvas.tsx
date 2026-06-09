"use client";

import { useAnimationFrame } from "motion/react";
import { useEffect, useRef } from "react";

type Point = { x: number; y: number };

type Props = {
	isDebug?: boolean;
	resetKey?: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpPoint = (a: Point, b: Point, t: number): Point => ({
	x: lerp(a.x, b.x, t),
	y: lerp(a.y, b.y, t),
});

/** Point on a cubic bezier at t — de Casteljau (nested lerp). */
const cubicBezierPointByLerp = (
	t: number,
	p0: Point,
	p1: Point,
	p2: Point,
	p3: Point,
): Point => {
	const a = lerpPoint(p0, p1, t);
	const b = lerpPoint(p1, p2, t);
	const c = lerpPoint(p2, p3, t);
	const d = lerpPoint(a, b, t);
	const e = lerpPoint(b, c, t);
	return lerpPoint(d, e, t);
};

/** Split a cubic bezier at t — also de Casteljau. */
const subdivideCubicBezier = (
	t: number,
	p0: Point,
	p1: Point,
	p2: Point,
	p3: Point,
): [[Point, Point, Point, Point], [Point, Point, Point, Point]] => {
	const a = lerpPoint(p0, p1, t);
	const b = lerpPoint(p1, p2, t);
	const c = lerpPoint(p2, p3, t);
	const d = lerpPoint(a, b, t);
	const e = lerpPoint(b, c, t);
	const f = lerpPoint(d, e, t);
	return [
		[p0, a, d, f],
		[f, e, c, p3],
	];
};

const crossFromLine = (p: Point, lineA: Point, lineB: Point) => {
	const dx = lineB.x - lineA.x;
	const dy = lineB.y - lineA.y;
	return (p.x - lineA.x) * dy - (p.y - lineA.y) * dx;
};

/** Find curve–line crossing by recursively subdividing with lerp. */
const findBezierLinePointByLerp = (
	p0: Point,
	p1: Point,
	p2: Point,
	p3: Point,
	lineA: Point,
	lineB: Point,
	depth = 0,
): Point | null => {
	const d0 = crossFromLine(p0, lineA, lineB);
	const d3 = crossFromLine(p3, lineA, lineB);
	if (d0 * d3 > 0) return null;

	if (depth > 24 || Math.hypot(p0.x - p3.x, p0.y - p3.y) < 0.5) {
		const t = d0 / (d0 - d3);
		return cubicBezierPointByLerp(t, p0, p1, p2, p3);
	}

	const [left, right] = subdivideCubicBezier(0.5, p0, p1, p2, p3);
	return (
		findBezierLinePointByLerp(...left, lineA, lineB, depth + 1) ??
		findBezierLinePointByLerp(...right, lineA, lineB, depth + 1)
	);
};

/** Intersection of two infinite lines (a→b and c→d). */
const lineLineIntersect = (
	a: Point,
	b: Point,
	c: Point,
	d: Point,
): Point | null => {
	const denom = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
	if (Math.abs(denom) < 1e-10) return null;

	const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denom;

	return {
		x: a.x + t * (b.x - a.x),
		y: a.y + t * (b.y - a.y),
	};
};

const reflectPointAcrossLine = (
	p: Point,
	lineA: Point,
	lineB: Point,
): Point => {
	const dx = lineB.x - lineA.x;
	const dy = lineB.y - lineA.y;
	const lenSq = dx * dx + dy * dy;
	if (lenSq < 1e-10) return p;

	const t = ((p.x - lineA.x) * dx + (p.y - lineA.y) * dy) / lenSq;
	const px = lineA.x + t * dx;
	const py = lineA.y + t * dy;
	return { x: 2 * px - p.x, y: 2 * py - p.y };
};

const traceCubicBezierByLerp = (
	ctx: CanvasRenderingContext2D,
	p0: Point,
	p1: Point,
	p2: Point,
	p3: Point,
	steps = 20,
) => {
	for (let i = 1; i <= steps; i++) {
		const p = cubicBezierPointByLerp(i / steps, p0, p1, p2, p3);
		ctx.lineTo(p.x, p.y);
	}
};

type CornerId = "tl" | "tr" | "br" | "bl";

type NoteCorners = Record<CornerId, Point>;

type FoldGeometry = {
	corner: CornerId;
	cornerPoint: Point;
	foldA: Point;
	foldB: Point;
	handle: Point;
	adjacentA: Point;
	adjacentB: Point;
	farCorner: Point;
	foldOverA: boolean;
	foldOverB: boolean;
	foldHitA: Point | null;
	foldHitB: Point | null;
	edgeHitA: Point | null;
	edgeHitB: Point | null;
};

const CORNER_IDS: CornerId[] = ["tl", "tr", "br", "bl"];
const MOVE_NOTE_LERP = 0.1;
const DRAG_LERP = MOVE_NOTE_LERP * 2;
/** Horizontal-edge fold (foldA) is twice as reactive as vertical-edge fold (foldB). */
const FOLD_A_REACTIVITY = 1.1;
const FOLD_B_REACTIVITY = 1.1;

const getNoteCorners = (
	cx: number,
	cy: number,
	w: number,
	h: number,
): NoteCorners => ({
	tl: { x: cx - w / 2, y: cy - h / 2 },
	tr: { x: cx + w / 2, y: cy - h / 2 },
	br: { x: cx + w / 2, y: cy + h / 2 },
	bl: { x: cx - w / 2, y: cy + h / 2 },
});

const detectCorner = (
	point: Point,
	corners: NoteCorners,
	w: number,
	h: number,
): CornerId | null => {
	const hitRadius = Math.min(w, h) * 0.35;
	let closest: CornerId | null = null;
	let minDist = hitRadius ** 2;

	for (const id of CORNER_IDS) {
		const c = corners[id];
		const dist = (point.x - c.x) ** 2 + (point.y - c.y) ** 2;
		if (dist < minDist) {
			minDist = dist;
			closest = id;
		}
	}

	return closest;
};

const isValidFoldDrag = (corner: CornerId, diff: Point): boolean => {
	switch (corner) {
		case "tr":
			return diff.x < 0 && diff.y > 0;
		case "tl":
			return diff.x > 0 && diff.y > 0;
		case "br":
			return diff.x < 0 && diff.y < 0;
		case "bl":
			return diff.x > 0 && diff.y < 0;
	}
};

type Rect = { minX: number; maxX: number; minY: number; maxY: number };

const OPPOSITE_QUADRANT_RATIO = 0.3;

/** 30% × 30% region anchored at the note corner opposite the fold. */
const getOppositeQuadrant = (
	corner: CornerId,
	cx: number,
	cy: number,
	w: number,
	h: number,
): Rect => {
	const qw = w * OPPOSITE_QUADRANT_RATIO;
	const qh = h * OPPOSITE_QUADRANT_RATIO;
	const hw = w / 2;
	const hh = h / 2;

	switch (corner) {
		case "tl":
			return {
				minX: cx + hw - qw,
				maxX: cx + hw,
				minY: cy + hh - qh,
				maxY: cy + hh,
			};
		case "tr":
			return {
				minX: cx - hw,
				maxX: cx - hw + qw,
				minY: cy + hh - qh,
				maxY: cy + hh,
			};
		case "br":
			return {
				minX: cx - hw,
				maxX: cx - hw + qw,
				minY: cy - hh,
				maxY: cy - hh + qh,
			};
		case "bl":
			return {
				minX: cx + hw - qw,
				maxX: cx + hw,
				minY: cy - hh,
				maxY: cy - hh + qh,
			};
	}
};

const pointInRect = (p: Point, r: Rect) =>
	p.x >= r.minX && p.x <= r.maxX && p.y >= r.minY && p.y <= r.maxY;

const segmentSegmentIntersect = (
	a: Point,
	b: Point,
	c: Point,
	d: Point,
): boolean => {
	const denom = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
	if (Math.abs(denom) < 1e-10) return false;

	const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denom;
	const u = -((a.x - b.x) * (a.y - c.y) - (a.y - b.y) * (a.x - c.x)) / denom;

	return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};

const segmentIntersectsRect = (a: Point, b: Point, r: Rect): boolean => {
	if (pointInRect(a, r) || pointInRect(b, r)) return true;

	const edges: [Point, Point][] = [
		[
			{ x: r.minX, y: r.minY },
			{ x: r.maxX, y: r.minY },
		],
		[
			{ x: r.maxX, y: r.minY },
			{ x: r.maxX, y: r.maxY },
		],
		[
			{ x: r.maxX, y: r.maxY },
			{ x: r.minX, y: r.maxY },
		],
		[
			{ x: r.minX, y: r.maxY },
			{ x: r.minX, y: r.minY },
		],
	];

	for (const [c, d] of edges) {
		if (segmentSegmentIntersect(a, b, c, d)) return true;
	}

	return false;
};

/** True when the fold line enters the quadrant opposite the folded corner. */
const doesFoldLineIntersectOppositeQuadrant = (
	corner: CornerId,
	foldA: Point,
	foldB: Point,
	cx: number,
	cy: number,
	w: number,
	h: number,
): boolean => {
	const opposite = getOppositeQuadrant(corner, cx, cy, w, h);
	return segmentIntersectsRect(foldA, foldB, opposite);
};

const computeFoldGeometry = (
	corner: CornerId,
	corners: NoteCorners,
	diff: Point,
): FoldGeometry => {
	const cornerPoint = corners[corner];
	const dy = diff.y * FOLD_A_REACTIVITY;
	const dx = diff.x * FOLD_B_REACTIVITY;
	let foldA: Point;
	let foldB: Point;
	let adjacentA: Point;
	let adjacentB: Point;
	let farCorner: Point;
	let farEdgeA: [Point, Point];
	let farEdgeB: [Point, Point];
	let foldOverA: boolean;
	let foldOverB: boolean;

	switch (corner) {
		case "tr":
			foldA = { x: cornerPoint.x - dy, y: cornerPoint.y };
			foldB = { x: cornerPoint.x, y: cornerPoint.y - dx };
			adjacentA = corners.tl;
			adjacentB = corners.br;
			farCorner = corners.bl;
			farEdgeA = [corners.bl, corners.br];
			farEdgeB = [corners.tl, corners.bl];
			foldOverA = foldA.x < adjacentA.x;
			foldOverB = foldB.y > adjacentB.y;
			break;
		case "tl":
			foldA = { x: cornerPoint.x + dy, y: cornerPoint.y };
			foldB = { x: cornerPoint.x, y: cornerPoint.y + dx };
			adjacentA = corners.tr;
			adjacentB = corners.bl;
			farCorner = corners.br;
			farEdgeA = [corners.bl, corners.br];
			farEdgeB = [corners.tr, corners.br];
			foldOverA = foldA.x > adjacentA.x;
			foldOverB = foldB.y > adjacentB.y;
			break;
		case "br":
			foldA = { x: cornerPoint.x + dy, y: cornerPoint.y };
			foldB = { x: cornerPoint.x, y: cornerPoint.y + dx };
			adjacentA = corners.bl;
			adjacentB = corners.tr;
			farCorner = corners.tl;
			farEdgeA = [corners.tl, corners.tr];
			farEdgeB = [corners.tl, corners.bl];
			foldOverA = foldA.x < adjacentA.x;
			foldOverB = foldB.y < adjacentB.y;
			break;
		case "bl":
			foldA = { x: cornerPoint.x - dy, y: cornerPoint.y };
			foldB = { x: cornerPoint.x, y: cornerPoint.y - dx };
			adjacentA = corners.br;
			adjacentB = corners.tl;
			farCorner = corners.tr;
			farEdgeA = [corners.tl, corners.tr];
			farEdgeB = [corners.tr, corners.br];
			foldOverA = foldA.x > adjacentA.x;
			foldOverB = foldB.y < adjacentB.y;
			break;
	}

	const handle = reflectPointAcrossLine(cornerPoint, foldA, foldB);
	const foldHitA = lineLineIntersect(foldA, foldB, ...farEdgeA);
	const foldHitB = lineLineIntersect(foldA, foldB, ...farEdgeB);
	const edgeHitA = reflectPointAcrossLine(adjacentB, foldA, foldB);
	const edgeHitB = reflectPointAcrossLine(adjacentA, foldA, foldB);

	return {
		corner,
		cornerPoint,
		foldA,
		foldB,
		handle,
		adjacentA,
		adjacentB,
		farCorner,
		foldOverA,
		foldOverB,
		foldHitA,
		foldHitB,
		edgeHitA,
		edgeHitB,
	};
};

const fillPolygon = (
	ctx: CanvasRenderingContext2D,
	points: Point[],
	color: string,
) => {
	if (points.length < 3) return;
	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);
	for (let i = 1; i < points.length; i++) {
		ctx.lineTo(points[i].x, points[i].y);
	}
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();
};

const getFrontFacePolygon = (
	g: FoldGeometry,
): { front: Point[]; back: Point[] } => {
	const { foldA, foldB, handle, adjacentA, adjacentB, farCorner } = g;
	const { foldHitA, foldHitB, edgeHitA, edgeHitB, foldOverA, foldOverB } = g;

	if (foldOverA && foldOverB && foldHitA && foldHitB && edgeHitA && edgeHitB) {
		return {
			front: [foldHitA, foldHitB, farCorner],
			back: [handle, edgeHitB, foldHitB, foldHitA, edgeHitA],
		};
	}

	if (foldOverB && foldHitA && edgeHitA) {
		return {
			front: [foldHitA, farCorner, adjacentA, foldA],
			back: [handle, foldA, foldHitA, edgeHitA],
		};
	}

	if (foldOverA && foldHitB && edgeHitB) {
		return {
			front: [foldB, adjacentB, farCorner, foldHitB],
			back: [handle, edgeHitB, foldHitB, foldB],
		};
	}

	return {
		front: [adjacentB, farCorner, adjacentA, foldA, foldB],
		back: [handle, foldA, foldB],
	};
};

const drawFlatNote = (
	ctx: CanvasRenderingContext2D,
	corners: NoteCorners,
	color: string,
) => {
	fillPolygon(ctx, [corners.tl, corners.tr, corners.br, corners.bl], color);
};

const drawNoteText = (
	ctx: CanvasRenderingContext2D,
	polygon: Point[],
	center: Point,
	text: string,
) => {
	if (polygon.length < 3) return;

	ctx.save();
	ctx.beginPath();
	ctx.moveTo(polygon[0].x, polygon[0].y);
	for (let i = 1; i < polygon.length; i++) {
		ctx.lineTo(polygon[i].x, polygon[i].y);
	}
	ctx.closePath();
	ctx.clip();
	ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
	ctx.font = "16px system-ui, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(text, center.x, center.y);
	ctx.restore();
};

type DrawState = {
	corners: NoteCorners;
	center: Point;
	width: number;
	height: number;
	fold: FoldGeometry | null;
	frontColor: string;
	backColor: string;
	text: string;
};

const draw = (ctx: CanvasRenderingContext2D, state: DrawState) => {
	if (state.fold) {
		const { front, back } = getFrontFacePolygon(state.fold);
		fillPolygon(ctx, front, state.frontColor);
		drawNoteText(ctx, front, state.center, state.text);
		fillPolygon(ctx, back, state.backColor);
	} else {
		const front = [
			state.corners.tl,
			state.corners.tr,
			state.corners.br,
			state.corners.bl,
		];
		drawFlatNote(ctx, state.corners, state.frontColor);
		drawNoteText(ctx, front, state.center, state.text);
	}
};

const drawDebugDot = (
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	color = "red",
) => {
	ctx.beginPath();
	ctx.arc(x, y, 4, 0, 2 * Math.PI);
	ctx.fillStyle = color;
	ctx.fill();
};

const drawDebugLine = (
	ctx: CanvasRenderingContext2D,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	color = "red",
) => {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.strokeStyle = color;
	ctx.stroke();
};

const drawDebug = (ctx: CanvasRenderingContext2D, state: DrawState) => {
	const { corners, fold } = state;

	ctx.beginPath();
	ctx.moveTo(corners.tl.x, corners.tl.y);
	ctx.lineTo(corners.tr.x, corners.tr.y);
	ctx.lineTo(corners.br.x, corners.br.y);
	ctx.lineTo(corners.bl.x, corners.bl.y);
	ctx.strokeStyle = "grey";
	ctx.closePath();
	ctx.stroke();

	const { center } = state;
	const { tl, tr, bl } = corners;

	drawDebugLine(ctx, center.x, tl.y, center.x, bl.y, "rgba(0, 120, 255, 0.4)");
	drawDebugLine(ctx, tl.x, center.y, tr.x, center.y, "rgba(0, 120, 255, 0.4)");

	if (!fold) return;

	const opposite = getOppositeQuadrant(
		fold.corner,
		center.x,
		center.y,
		state.width,
		state.height,
	);
	ctx.strokeStyle = "rgba(255, 140, 0, 0.5)";
	ctx.strokeRect(
		opposite.minX,
		opposite.minY,
		opposite.maxX - opposite.minX,
		opposite.maxY - opposite.minY,
	);

	const { cornerPoint, foldA, foldB, handle } = fold;

	drawDebugDot(ctx, cornerPoint.x, cornerPoint.y);
	drawDebugDot(ctx, foldA.x, foldA.y);
	drawDebugDot(ctx, foldB.x, foldB.y);
	drawDebugLine(ctx, cornerPoint.x, cornerPoint.y, foldA.x, foldA.y);
	drawDebugLine(ctx, cornerPoint.x, cornerPoint.y, foldB.x, foldB.y);
	drawDebugLine(ctx, foldA.x, foldA.y, foldB.x, foldB.y);

	drawDebugDot(ctx, handle.x, handle.y, "cyan");
	drawDebugLine(ctx, foldA.x, foldA.y, handle.x, handle.y, "cyan");
	drawDebugLine(ctx, foldB.x, foldB.y, handle.x, handle.y, "cyan");

	if (fold.foldOverB) {
		if (fold.foldHitA)
			drawDebugDot(ctx, fold.foldHitA.x, fold.foldHitA.y, "green");
		if (fold.edgeHitA)
			drawDebugDot(ctx, fold.edgeHitA.x, fold.edgeHitA.y, "green");
		if (fold.foldHitA && fold.edgeHitA) {
			drawDebugLine(
				ctx,
				fold.foldHitA.x,
				fold.foldHitA.y,
				fold.edgeHitA.x,
				fold.edgeHitA.y,
				"green",
			);
		}
	}

	if (fold.foldOverA) {
		if (fold.foldHitB)
			drawDebugDot(ctx, fold.foldHitB.x, fold.foldHitB.y, "green");
		if (fold.edgeHitB)
			drawDebugDot(ctx, fold.edgeHitB.x, fold.edgeHitB.y, "green");
		if (fold.foldHitB && fold.edgeHitB) {
			drawDebugLine(
				ctx,
				fold.foldHitB.x,
				fold.foldHitB.y,
				fold.edgeHitB.x,
				fold.edgeHitB.y,
				"green",
			);
		}
	}
};

const resetNoteState = (
	note: {
		x: number;
		y: number;
		isDragging: boolean;
		moveNote: boolean;
		activeCorner: CornerId | null;
		dragStart: Point;
		drag: Point;
		dragTarget: Point;
	},
	center: Point,
) => {
	note.x = center.x;
	note.y = center.y;
	note.isDragging = false;
	note.moveNote = false;
	note.activeCorner = null;
	note.dragStart = { ...center };
	note.drag = { ...center };
	note.dragTarget = { ...center };
};

function StickyNoteCanvas({ isDebug = true, resetKey = 0 }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const dprRef = useRef(1);
	const activePointerIdRef = useRef<number | null>(null);

	const noteRef = useRef({
		x: 0,
		y: 0,
		width: 100,
		height: 100,
		color: "#ffff88",
		backColor: "#F5F6C3",
		text: "Drag me.",
		isDragging: false,
		activeCorner: null as CornerId | null,
		dragStart: {
			x: 0,
			y: 0,
		},
		drag: {
			x: 0,
			y: 0,
		},
		dragTarget: {
			x: 0,
			y: 0,
		},
		moveNote: false,
	});

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const container = containerRef.current;
		if (!container) return;

		const getLocalPoint = (e: PointerEvent): Point => {
			const rect = canvas.getBoundingClientRect();
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
		};

		const endPointer = (e: PointerEvent) => {
			if (activePointerIdRef.current !== e.pointerId) return;

			activePointerIdRef.current = null;
			if (canvas.hasPointerCapture(e.pointerId)) {
				canvas.releasePointerCapture(e.pointerId);
			}

			noteRef.current.moveNote = false;
			noteRef.current.isDragging = false;
		};

		const resize = () => {
			if (!container) return;

			const scale = window.devicePixelRatio;
			dprRef.current = scale;
			canvas.width = container.clientWidth * scale;
			canvas.height = container.clientHeight * scale;
			canvas.style.width = `${container.clientWidth}px`;
			canvas.style.height = `${container.clientHeight}px`;

			const containerAspectRatio =
				container.clientWidth / container.clientHeight;

			if (containerAspectRatio > 1) {
				noteRef.current.width = container.clientWidth / 3;
				noteRef.current.height = container.clientWidth / 3;
			} else {
				noteRef.current.width = container.clientHeight / 3;
				noteRef.current.height = container.clientHeight / 3;
			}

			noteRef.current.x = container.clientWidth / 2;
			noteRef.current.y = container.clientHeight / 2;
		};

		resize();

		const handlePointerDown = (e: PointerEvent) => {
			if (activePointerIdRef.current !== null) return;

			const { x, y } = getLocalPoint(e);
			const note = noteRef.current;
			const corners = getNoteCorners(note.x, note.y, note.width, note.height);

			activePointerIdRef.current = e.pointerId;
			canvas.setPointerCapture(e.pointerId);

			note.isDragging = true;
			note.activeCorner = detectCorner(
				{ x, y },
				corners,
				note.width,
				note.height,
			);
			note.dragStart.x = x;
			note.dragStart.y = y;
			note.drag.x = x;
			note.drag.y = y;
			note.dragTarget.x = x;
			note.dragTarget.y = y;
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (
				!noteRef.current.isDragging ||
				activePointerIdRef.current !== e.pointerId
			) {
				return;
			}

			const { x, y } = getLocalPoint(e);
			noteRef.current.dragTarget.x = x;
			noteRef.current.dragTarget.y = y;
		};

		const handlePointerUp = (e: PointerEvent) => {
			endPointer(e);
		};

		const handlePointerCancel = (e: PointerEvent) => {
			endPointer(e);
		};

		const handleLostPointerCapture = (e: PointerEvent) => {
			if (activePointerIdRef.current !== e.pointerId) return;
			activePointerIdRef.current = null;
			noteRef.current.moveNote = false;
			noteRef.current.isDragging = false;
		};

		window.addEventListener("resize", resize);
		canvas.addEventListener("pointerdown", handlePointerDown);
		canvas.addEventListener("pointermove", handlePointerMove);
		canvas.addEventListener("pointerup", handlePointerUp);
		canvas.addEventListener("pointercancel", handlePointerCancel);
		canvas.addEventListener("lostpointercapture", handleLostPointerCapture);

		return () => {
			window.removeEventListener("resize", resize);
			canvas.removeEventListener("pointerdown", handlePointerDown);
			canvas.removeEventListener("pointermove", handlePointerMove);
			canvas.removeEventListener("pointerup", handlePointerUp);
			canvas.removeEventListener("pointercancel", handlePointerCancel);
			canvas.removeEventListener(
				"lostpointercapture",
				handleLostPointerCapture,
			);
		};
	}, []);

	useEffect(() => {
		if (resetKey === 0) return;

		const container = containerRef.current;
		const canvas = canvasRef.current;
		if (!container) return;

		if (canvas && activePointerIdRef.current !== null) {
			if (canvas.hasPointerCapture(activePointerIdRef.current)) {
				canvas.releasePointerCapture(activePointerIdRef.current);
			}
			activePointerIdRef.current = null;
		}

		resetNoteState(noteRef.current, {
			x: container.clientWidth / 2,
			y: container.clientHeight / 2,
		});
	}, [resetKey]);

	useAnimationFrame(() => {
		const note = noteRef.current;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = dprRef.current;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

		if (noteRef.current.moveNote) {
			note.x = lerp(note.x, note.dragTarget.x, MOVE_NOTE_LERP);
			note.y = lerp(note.y, note.dragTarget.y, MOVE_NOTE_LERP);
		} else if (note.isDragging) {
			note.drag.x = lerp(note.drag.x, note.dragTarget.x, DRAG_LERP);
			note.drag.y = lerp(note.drag.y, note.dragTarget.y, DRAG_LERP);
		} else {
			note.dragStart.x = lerp(note.dragStart.x, note.drag.x, 0.2);
			note.dragStart.y = lerp(note.dragStart.y, note.drag.y, 0.2);
		}

		const diff = {
			x: note.drag.x - note.dragStart.x,
			y: note.drag.y - note.dragStart.y,
		};

		const w = note.width;
		const h = note.height;
		const cx = note.x;
		const cy = note.y;
		const corners = getNoteCorners(cx, cy, w, h);

		const activeCorner = note.activeCorner;
		const isFoldActive =
			activeCorner !== null && isValidFoldDrag(activeCorner, diff);

		const fold = isFoldActive
			? computeFoldGeometry(activeCorner, corners, diff)
			: null;

		const drawState: DrawState = {
			corners,
			center: { x: cx, y: cy },
			width: w,
			height: h,
			fold,
			frontColor: note.color,
			backColor: note.backColor,
			text: note.text,
		};

		draw(ctx, drawState);
		if (isDebug) drawDebug(ctx, drawState);

		if (
			fold &&
			doesFoldLineIntersectOppositeQuadrant(
				fold.corner,
				fold.foldA,
				fold.foldB,
				cx,
				cy,
				w,
				h,
			)
		) {
			noteRef.current.moveNote = true;
		}
	});

	return (
		<div ref={containerRef} className="absolute inset-0 h-full w-full">
			<canvas
				ref={canvasRef}
				className="absolute inset-0 h-full w-full touch-none"
			/>
		</div>
	);
}

export default StickyNoteCanvas;
