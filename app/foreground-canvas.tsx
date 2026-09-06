"use client";

import { useLayoutEffect, useRef } from "react";
import { lerp } from "@/lib/math";
import type { Rgb } from "@/lib/page-color";
import {
  buildParticleBuffer,
  createParticleFieldRenderer,
  gridForCanvas,
  type ParticleOrigin,
} from "@/lib/page-particle-field";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";
import { usePageColor } from "@/stores/page-color";
import { usePageTransition } from "@/stores/page-transition";
import {
  initParticleDebugFromUrl,
  useParticleDebug,
} from "@/stores/particle-debug";

type FieldApi = {
  play: (from: ParticleOrigin) => void;
};

const COLOR_BLEND_SECONDS = 0.85;

function copyRgb(to: [number, number, number], from: Rgb) {
  to[0] = from[0];
  to[1] = from[1];
  to[2] = from[2];
}

type Props = {
  className?: string;
};

const ForegroundCanvas = ({ className }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<FieldApi | null>(null);
  const generation = usePageTransition((state) => state.generation);
  const phase = usePageTransition((state) => state.phase);
  const entryFrom = usePageTransition((state) => state.entryFrom);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = createParticleFieldRenderer(canvas);
    if (!renderer) return;

    initParticleDebugFromUrl();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let raf = 0;
    let running = true;
    let filled = reduceMotion;
    let fillEnd = 0;
    let cols = 0;
    let rows = 0;
    let vertexCount = 0;
    let fieldData: Float32Array | null = null;
    let startedAt = performance.now() / 1000;
    let notifiedCover = false;
    let playToken = 0;
    let fromSide: ParticleOrigin = "all";
    const displayColor: [number, number, number] = [0, 0, 0];
    const blendFrom: [number, number, number] = [0, 0, 0];
    let blendTo: Rgb = displayColor;
    let blendStartedAt = 0;
    let blendDuration = 0;

    const colors = () => usePageColor.getState();
    const debug = () => useParticleDebug.getState().enabled;

    const snapDisplayColor = (to: Rgb) => {
      copyRgb(displayColor, to);
      copyRgb(blendFrom, to);
      blendTo = to;
      blendDuration = 0;
    };

    const beginColorBlend = (to: Rgb) => {
      copyRgb(blendFrom, displayColor);
      blendTo = to;
      blendStartedAt = performance.now() / 1000;
      blendDuration = COLOR_BLEND_SECONDS;
    };

    const sampleDisplayColor = (): Rgb => {
      if (blendDuration <= 0) return displayColor;
      const t = (performance.now() / 1000 - blendStartedAt) / blendDuration;
      if (t >= 1) {
        snapDisplayColor(blendTo);
        return displayColor;
      }
      const e = 1 - (1 - Math.min(1, Math.max(0, t))) ** 4;
      displayColor[0] = lerp(blendFrom[0], blendTo[0], e);
      displayColor[1] = lerp(blendFrom[1], blendTo[1], e);
      displayColor[2] = lerp(blendFrom[2], blendTo[2], e);
      return displayColor;
    };

    const commitSettledField = () => {
      if (!fieldData || vertexCount === 0) return;
      usePageTransition.getState().commitParticleField({
        data: fieldData,
        vertexCount,
        cols,
        rows,
        color: colors().current,
      });
    };

    const markCovered = () => {
      if (notifiedCover) return;
      notifiedCover = true;
      usePageTransition.getState().markCovered();
    };

    const uploadParticles = (force = false) => {
      const next = gridForCanvas(canvas);
      if (
        !force &&
        next.cols === cols &&
        next.rows === rows &&
        vertexCount > 0
      ) {
        return;
      }
      cols = next.cols;
      rows = next.rows;
      const packed = buildParticleBuffer(cols, rows, fromSide);
      fillEnd = packed.fillEnd;
      vertexCount = packed.vertexCount;
      fieldData = packed.data;
      renderer.upload({ ...packed, cols, rows });
    };

    const loop = (token: number) => {
      if (!running || token !== playToken) return;
      if (vertexCount === 0) {
        raf = requestAnimationFrame(() => loop(token));
        return;
      }
      const time = performance.now() / 1000 - startedAt;
      if (time >= fillEnd) {
        filled = true;
        commitSettledField();
        renderer.drawIdle();
        markCovered();
        return;
      }
      renderer.draw(time, sampleDisplayColor(), debug());
      raf = requestAnimationFrame(() => loop(token));
    };

    const play = (from: ParticleOrigin) => {
      cancelAnimationFrame(raf);
      fromSide = from;
      notifiedCover = false;
      const token = ++playToken;
      const target = colors().current;
      if (blendDuration > 0) beginColorBlend(target);
      else snapDisplayColor(target);
      if (reduceMotion) {
        filled = true;
        uploadParticles(true);
        commitSettledField();
        renderer.drawIdle();
        markCovered();
        return;
      }
      filled = false;
      startedAt = performance.now() / 1000;
      cols = 0;
      rows = 0;
      vertexCount = 0;
      fieldData = null;
      uploadParticles(true);
      loop(token);
    };

    apiRef.current = { play };

    const unsubColor = usePageColor.subscribe((state, prev) => {
      if (state.current === prev.current && state.previous === prev.previous) {
        return;
      }
      if (reduceMotion) {
        if (filled) renderer.drawIdle();
        return;
      }
      const { covering, covered } = usePageTransition.getState();
      if (covering && !covered) {
        beginColorBlend(state.current);
        return;
      }
      if (filled) renderer.drawIdle();
    });

    const unsubDebug = useParticleDebug.subscribe((state, prev) => {
      if (state.enabled === prev.enabled) return;
      if (filled || reduceMotion) {
        renderer.drawIdle();
        return;
      }
      const time = performance.now() / 1000 - startedAt;
      renderer.draw(time, sampleDisplayColor(), state.enabled);
    });

    const disconnectResize = observeCanvasPixelSize(canvas, () => {
      if (!filled && !reduceMotion) uploadParticles();
      const time = performance.now() / 1000 - startedAt;
      if (filled || reduceMotion) {
        renderer.drawIdle();
        return;
      }
      renderer.draw(time, sampleDisplayColor(), debug());
    });

    return () => {
      running = false;
      apiRef.current = null;
      cancelAnimationFrame(raf);
      unsubColor();
      unsubDebug();
      disconnectResize();
      renderer.destroy();
    };
  }, []);

  useLayoutEffect(() => {
    if (generation === 0) return;
    if (phase !== "covering") return;
    apiRef.current?.play(entryFrom);
  }, [phase, generation, entryFrom]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-30 h-svh w-full",
        className,
      )}
      style={CANVAS_STYLE}
    />
  );
};

export default ForegroundCanvas;
