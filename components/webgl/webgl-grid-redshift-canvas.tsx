"use client";

import { type MotionValue, useMotionValueEvent } from "motion/react";
import type { StaticImageData } from "next/image";
import { type RefObject, useEffect, useRef } from "react";
import {
	buildCellQuadVerts,
	CANVAS_STYLE,
	type CellRect,
	createProgram,
	createQuadBuffer,
	createScheduledDraw,
	drawQuad,
	getOptimizedImageSrc,
	getWebGLContext,
	loadImage,
	observeCanvasPixelSize,
	QUAD_VS,
	snapPixelCellSize,
	updateQuadBuffer,
	uploadTextureFromImage,
} from "@/lib/webgl";

export type WebGLGridRedshiftCanvasProps = {
	className?: string;
	images: StaticImageData[];
	cellRefs: RefObject<(HTMLElement | null)[]>;
	/** Observed for resize / parallax layout updates. */
	layoutRootRef?: RefObject<HTMLElement | null>;
	/** Scroll-driven shift in screen pixels (signed): horizontal shear by y + red fringe. */
	shift: MotionValue<number>;
	/** Call to remeasure cell layout (e.g. after parallax offset changes). */
	invalidateRef?: RefObject<(() => void) | null>;
	/** Grid cell size in pixels (displacement is constant within each cell). */
	pixelSize?: number;
	quality?: number;
};

type TextureSlot = {
	w: number;
	h: number;
	texture: WebGLTexture | null;
};

const CHROMA_PAD_PX = 8;

const FS = `
precision mediump float;
varying vec2 vCellUv;
uniform vec2 uCellSize;
uniform vec2 uPixelSize;
uniform float uShift;
uniform sampler2D uTexture;

bool inBounds(vec2 uv) {
  return uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;
}

vec4 sampleBase(vec2 uv) {
  return inBounds(uv) ? texture2D(uTexture, uv) : vec4(0.0);
}

vec4 sampleRed(vec2 uv) {
  return inBounds(uv) ? texture2D(uTexture, uv) : vec4(0.0);
}

void main() {
  vec2 normCell = uPixelSize / uCellSize;
  vec2 cellIndex = floor(vCellUv / normCell);
  vec2 cellCenterUv = (cellIndex + 0.5) * normCell;

  float dispFactor = cos(3.14159265359 * (cellCenterUv.y - 0.5)) * 5.0;
  vec2 sampleUv = vCellUv - vec2(-uShift * dispFactor / uCellSize.x, 0.0);
  vec2 redUv = sampleUv + vec2(-uShift / uCellSize.x, 0.0);

  vec4 base = sampleBase(sampleUv);
  vec4 red = sampleRed(redUv);

  gl_FragColor = vec4(red.r, base.g, base.b, max(base.a, red.a));
}
`;

function quadPaddingPx(shift: number) {
	return Math.ceil(Math.abs(shift)) + CHROMA_PAD_PX;
}

function measureCellRects(
	canvas: HTMLCanvasElement,
	cells: (HTMLElement | null)[],
): (CellRect | null)[] {
	const canvasRect = canvas.getBoundingClientRect();
	if (canvasRect.width <= 0 || canvasRect.height <= 0) {
		return cells.map(() => null);
	}

	const scale = canvas.width / canvasRect.width;

	return cells.map((cell) => {
		if (!cell) return null;

		const rect = cell.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return null;

		return {
			x: Math.round((rect.left - canvasRect.left) * scale),
			y: Math.round((canvasRect.bottom - rect.bottom) * scale),
			w: Math.round(rect.width * scale),
			h: Math.round(rect.height * scale),
		};
	});
}

/**
 * Single WebGL canvas: each grid cell is a quad (6 vertices) in clip space
 * with per-corner cell UVs so shift/bleed extend past the layout box without viewports.
 */
export function WebGLGridRedshiftCanvas({
	className,
	images,
	cellRefs,
	layoutRootRef,
	shift,
	invalidateRef,
	pixelSize = 48,
	quality = 75,
}: WebGLGridRedshiftCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawRef = useRef<(() => void) | null>(null);
	const shiftRef = useRef(shift.get());
	shiftRef.current = shift.get();
	const invalidate = useRef(createScheduledDraw(drawRef));

	useEffect(() => {
		if (!invalidateRef) return;
		invalidateRef.current = invalidate.current;
		return () => {
			invalidateRef.current = null;
		};
	}, [invalidateRef]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || images.length === 0) return;

		let cancelled = false;
		let program: WebGLProgram | null = null;
		let quadBuf: WebGLBuffer | null = null;
		const textureSlots: TextureSlot[] = images.map(() => ({
			w: 0,
			h: 0,
			texture: null,
		}));
		const textureLoadIds = new Array<number>(images.length).fill(0);

		const gl = getWebGLContext(canvas);
		if (!gl) return;

		const reloadTexture = async (index: number, w: number, h: number) => {
			if (w <= 0 || h <= 0) return;

			const slot = textureSlots[index];
			if (slot.w === w && slot.h === h && slot.texture) return;

			const loadId = ++textureLoadIds[index];
			const src = getOptimizedImageSrc(images[index], w, h, quality);
			const imageElement = await loadImage(src);
			if (cancelled || loadId !== textureLoadIds[index]) return;

			if (slot.texture) gl.deleteTexture(slot.texture);
			slot.texture = uploadTextureFromImage(gl, imageElement);
			slot.w = w;
			slot.h = h;
			invalidate.current();
		};

		const syncTextures = (rects: (CellRect | null)[]) => {
			for (let i = 0; i < images.length; i++) {
				const rect = rects[i];
				if (!rect) continue;
				reloadTexture(i, rect.w, rect.h);
			}
		};

		program = createProgram(gl, QUAD_VS, FS);
		if (!program) return;

		const uCellSizeLoc = gl.getUniformLocation(program, "uCellSize");
		const uPixelSizeLoc = gl.getUniformLocation(program, "uPixelSize");
		const uShiftLoc = gl.getUniformLocation(program, "uShift");
		const uTextureLoc = gl.getUniformLocation(program, "uTexture");

		quadBuf = createQuadBuffer(gl);
		if (!quadBuf) {
			gl.deleteProgram(program);
			return;
		}

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		const draw = () => {
			const cells = cellRefs.current;
			const rects = measureCellRects(canvas, cells);
			const pad = quadPaddingPx(shiftRef.current);
			const bufferW = gl.drawingBufferWidth;
			const bufferH = gl.drawingBufferHeight;

			gl.viewport(0, 0, bufferW, bufferH);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			// biome-ignore lint/correctness/useHookAtTopLevel: not a hook
			gl.useProgram(program);
			if (uShiftLoc) gl.uniform1f(uShiftLoc, shiftRef.current);

			for (let i = 0; i < images.length; i++) {
				const rect = rects[i];
				const texture = textureSlots[i]?.texture;
				if (!rect || !texture || rect.w <= 0 || rect.h <= 0) continue;

				const verts = buildCellQuadVerts(rect, pad, bufferW, bufferH);
				updateQuadBuffer(gl, quadBuf, verts);

				if (uCellSizeLoc) gl.uniform2f(uCellSizeLoc, rect.w, rect.h);
				if (uPixelSizeLoc) {
					gl.uniform2f(
						uPixelSizeLoc,
						snapPixelCellSize(rect.w, pixelSize),
						snapPixelCellSize(rect.h, pixelSize),
					);
				}

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				if (uTextureLoc) gl.uniform1i(uTextureLoc, 0);

				drawQuad(gl, program, quadBuf);
			}
		};

		drawRef.current = draw;

		const disconnectCanvasResize = observeCanvasPixelSize(
			canvas,
			(_size, canvasSizeChanged) => {
				const rects = measureCellRects(canvas, cellRefs.current);
				if (canvasSizeChanged) syncTextures(rects);
				drawRef.current?.();
			},
		);

		const layoutRoot = layoutRootRef?.current ?? null;
		const layoutObserver = layoutRoot
			? new ResizeObserver(() => {
					const rects = measureCellRects(canvas, cellRefs.current);
					syncTextures(rects);
					invalidate.current();
				})
			: null;
		if (layoutRoot) layoutObserver?.observe(layoutRoot);

		const raf = requestAnimationFrame(() => {
			const rects = measureCellRects(canvas, cellRefs.current);
			syncTextures(rects);
			invalidate.current();
		});

		return () => {
			cancelled = true;
			cancelAnimationFrame(raf);
			disconnectCanvasResize();
			layoutObserver?.disconnect();
			drawRef.current = null;
			if (quadBuf) gl.deleteBuffer(quadBuf);
			for (const slot of textureSlots) {
				if (slot.texture) gl.deleteTexture(slot.texture);
			}
			if (program) gl.deleteProgram(program);
		};
	}, [images, cellRefs, layoutRootRef, pixelSize, quality]);

	useMotionValueEvent(shift, "change", (value) => {
		shiftRef.current = value;
		invalidate.current();
	});

	return <canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />;
}
