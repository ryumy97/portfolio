"use client";

import { useLayoutEffect, useRef } from "react";
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

    const colors = () => usePageColor.getState();
    const debug = () => useParticleDebug.getState().enabled;

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
      renderer.draw(time, colors().current, debug());
      raf = requestAnimationFrame(() => loop(token));
    };

    const play = (from: ParticleOrigin) => {
      cancelAnimationFrame(raf);
      fromSide = from;
      notifiedCover = false;
      const token = ++playToken;
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
      if (filled || reduceMotion) renderer.drawIdle();
    });

    const unsubDebug = useParticleDebug.subscribe((state, prev) => {
      if (state.enabled === prev.enabled) return;
      if (filled || reduceMotion) {
        renderer.drawIdle();
        return;
      }
      const time = performance.now() / 1000 - startedAt;
      renderer.draw(time, colors().current, state.enabled);
    });

    const disconnectResize = observeCanvasPixelSize(canvas, () => {
      if (!filled && !reduceMotion) uploadParticles();
      const time = performance.now() / 1000 - startedAt;
      if (filled || reduceMotion) {
        renderer.drawIdle();
        return;
      }
      renderer.draw(time, colors().current, debug());
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
