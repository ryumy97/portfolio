"use client";

import { useLayoutEffect, useRef } from "react";
import {
  createParticleFieldRenderer,
  type GatherSide,
  type ParticleField,
  retargetParticleBuffer,
  SETTLED_TIME,
} from "@/lib/page-particle-field";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";
import { usePageTransition } from "@/stores/page-transition";
import {
  initParticleDebugFromUrl,
  useParticleDebug,
} from "@/stores/particle-debug";

type FieldApi = {
  collect: (side: GatherSide) => void;
};

type Props = {
  className?: string;
};

const BackgroundCanvas = ({ className }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<FieldApi | null>(null);
  const generation = usePageTransition((state) => state.generation);
  const phase = usePageTransition((state) => state.phase);
  const gatherSide = usePageTransition((state) => state.gatherSide);

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
    let mode: "empty" | "idle" | "collecting" = "empty";
    let fillEnd = 0;
    let motionAt = 0;
    let startedAt = 0;
    let fieldColor: ParticleField["color"] | null = null;
    let collectToken = 0;
    let notifiedLeave = false;

    const debug = () => useParticleDebug.getState().enabled;

    const drawSettled = () => {
      const field = usePageTransition.getState().particleField;
      if (!field || !fieldColor) {
        renderer.drawIdle();
        return;
      }
      renderer.draw(SETTLED_TIME, fieldColor, debug());
    };

    const applyField = (field: ParticleField | null) => {
      cancelAnimationFrame(raf);
      collectToken += 1;
      if (!field) {
        mode = "empty";
        fieldColor = null;
        renderer.drawIdle();
        return;
      }
      mode = "idle";
      fieldColor = field.color;
      renderer.upload(field);
      renderer.draw(SETTLED_TIME, field.color, debug());
    };

    const loop = (token: number) => {
      if (!running || token !== collectToken || mode !== "collecting") return;
      if (!fieldColor) return;
      const time = performance.now() / 1000 - startedAt;
      if (!notifiedLeave && time >= motionAt) {
        notifiedLeave = true;
        usePageTransition.getState().markLeaveStarted();
      }
      if (time >= fillEnd) {
        mode = "empty";
        renderer.drawIdle();
        usePageTransition.getState().markCollected();
        return;
      }
      renderer.draw(time, fieldColor, debug(), true);
      raf = requestAnimationFrame(() => loop(token));
    };

    const collect = (side: GatherSide) => {
      cancelAnimationFrame(raf);
      const field = usePageTransition.getState().particleField;
      const token = ++collectToken;
      notifiedLeave = false;
      if (!field) {
        mode = "empty";
        renderer.drawIdle();
        usePageTransition.getState().markLeaveStarted();
        usePageTransition.getState().markCollected();
        return;
      }
      if (reduceMotion) {
        mode = "empty";
        fieldColor = field.color;
        renderer.drawIdle();
        usePageTransition.getState().markLeaveStarted();
        usePageTransition.getState().markCollected();
        return;
      }
      const packed = retargetParticleBuffer(field.data, side);
      fillEnd = packed.fillEnd;
      motionAt = packed.motionAt;
      fieldColor = field.color;
      renderer.upload({
        data: packed.data,
        vertexCount: field.vertexCount,
        cols: field.cols,
        rows: field.rows,
      });
      mode = "collecting";
      startedAt = performance.now() / 1000;
      loop(token);
    };

    apiRef.current = { collect };
    applyField(usePageTransition.getState().particleField);

    const unsubField = usePageTransition.subscribe((state, prev) => {
      const fieldChanged = state.particleField !== prev.particleField;
      const coverEnded = prev.covering && !state.covering;
      if (!fieldChanged && !coverEnded) return;
      // Inbound cover still owns the pixels; keep the settled field for collect.
      if (state.phase === "covering") return;
      applyField(state.particleField);
    });

    const unsubDebug = useParticleDebug.subscribe((state, prev) => {
      if (state.enabled === prev.enabled) return;
      if (mode === "empty") {
        renderer.drawIdle();
        return;
      }
      if (mode === "idle") {
        drawSettled();
        return;
      }
      if (!fieldColor) return;
      const time = performance.now() / 1000 - startedAt;
      renderer.draw(time, fieldColor, state.enabled, true);
    });

    const disconnectResize = observeCanvasPixelSize(canvas, () => {
      if (mode === "empty") {
        renderer.drawIdle();
        return;
      }
      if (mode === "idle") {
        drawSettled();
        return;
      }
      if (!fieldColor) return;
      const time = performance.now() / 1000 - startedAt;
      renderer.draw(time, fieldColor, debug(), true);
    });

    return () => {
      running = false;
      apiRef.current = null;
      cancelAnimationFrame(raf);
      unsubField();
      unsubDebug();
      disconnectResize();
      renderer.destroy();
    };
  }, []);

  useLayoutEffect(() => {
    if (generation === 0) return;
    if (phase !== "collecting") return;
    apiRef.current?.collect(gatherSide);
  }, [phase, generation, gatherSide]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-0 h-svh w-full",
        className,
      )}
      style={CANVAS_STYLE}
    />
  );
};

export default BackgroundCanvas;
