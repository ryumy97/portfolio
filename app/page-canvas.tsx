"use client";

import { useLayoutEffect, useRef } from "react";
import { lerp } from "@/lib/math";
import type { Rgb } from "@/lib/page-color";
import {
  buildParticleBuffer,
  createParticleFieldRenderer,
  type GatherSide,
  gridForCanvas,
  type ParticleField,
  type ParticleOrigin,
  retargetParticleBuffer,
  SETTLED_TIME,
} from "@/lib/page-particle-field";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";
import { usePageColor } from "@/stores/page-color";
import { usePageTransition } from "@/stores/page-transition";

type FieldApi = {
  play: (from: ParticleOrigin) => void;
  collect: (side: GatherSide) => void;
};

const COLOR_BLEND_SECONDS = 0.45;
const LANDING_DELAY_SECONDS = 0.8;

function copyRgb(to: [number, number, number], from: Rgb) {
  to[0] = from[0];
  to[1] = from[1];
  to[2] = from[2];
}

type Props = {
  className?: string;
};

const PageCanvas = ({ className }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<FieldApi | null>(null);
  const generation = usePageTransition((state) => state.generation);
  const phase = usePageTransition((state) => state.phase);
  const entryFrom = usePageTransition((state) => state.entryFrom);
  const gatherSide = usePageTransition((state) => state.gatherSide);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = createParticleFieldRenderer(canvas);
    if (!renderer) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let raf = 0;
    let delayTimer = 0;
    let running = true;
    let mode: "empty" | "idle" | "collecting" | "covering" = "empty";
    let fillEnd = 0;
    let revealAt = 0;
    let motionAt = 0;
    let cols = 0;
    let rows = 0;
    let vertexCount = 0;
    let fieldData: Float32Array | null = null;
    let fieldColor: ParticleField["color"] | null = null;
    let startedAt = 0;
    let notifiedCover = false;
    let notifiedLeave = false;
    let playToken = 0;
    let fromSide: ParticleOrigin = "all";
    const displayColor: [number, number, number] = [0, 0, 0];
    const blendFrom: [number, number, number] = [0, 0, 0];
    let blendTo: Rgb = displayColor;
    let blendStartedAt = 0;
    let blendDuration = 0;

    const colors = () => usePageColor.getState();

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

    const drawSettled = () => {
      const field = usePageTransition.getState().particleField;
      if (!field || !fieldColor) {
        renderer.drawIdle();
        return;
      }
      renderer.draw(SETTLED_TIME, fieldColor);
    };

    const commitSettledField = () => {
      if (!fieldData || vertexCount === 0) return;
      const color = colors().current;
      fieldColor = color;
      usePageTransition.getState().commitParticleField({
        data: fieldData,
        vertexCount,
        cols,
        rows,
        color,
      });
    };

    const markCovered = () => {
      if (notifiedCover) return;
      notifiedCover = true;
      commitSettledField();
      usePageTransition.getState().markCovered();
    };

    const markRevealed = () => {
      usePageTransition.getState().markRevealed();
    };

    const uploadCoverParticles = (force = false) => {
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
      revealAt = packed.revealAt;
      vertexCount = packed.vertexCount;
      fieldData = packed.data;
      renderer.upload({ ...packed, cols, rows });
    };

    const coverLoop = (token: number) => {
      if (!running || token !== playToken || mode !== "covering") return;
      if (vertexCount === 0) {
        raf = requestAnimationFrame(() => coverLoop(token));
        return;
      }
      const time = performance.now() / 1000 - startedAt;
      if (time >= revealAt) markCovered();
      if (time >= fillEnd) {
        mode = "idle";
        commitSettledField();
        drawSettled();
        markCovered();
        markRevealed();
        return;
      }
      renderer.draw(time, sampleDisplayColor());
      raf = requestAnimationFrame(() => coverLoop(token));
    };

    const collectLoop = (token: number) => {
      if (!running || token !== playToken || mode !== "collecting") return;
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
      renderer.draw(time, fieldColor, true);
      raf = requestAnimationFrame(() => collectLoop(token));
    };

    const play = (from: ParticleOrigin) => {
      cancelAnimationFrame(raf);
      window.clearTimeout(delayTimer);
      fromSide = from;
      notifiedCover = false;
      const token = ++playToken;
      const target = colors().current;
      if (blendDuration > 0) beginColorBlend(target);
      else snapDisplayColor(target);
      if (reduceMotion) {
        mode = "idle";
        uploadCoverParticles(true);
        commitSettledField();
        drawSettled();
        markCovered();
        markRevealed();
        return;
      }
      const begin = () => {
        if (!running || token !== playToken) return;
        mode = "covering";
        startedAt = performance.now() / 1000;
        cols = 0;
        rows = 0;
        vertexCount = 0;
        fieldData = null;
        uploadCoverParticles(true);
        coverLoop(token);
      };
      if (from === "all") {
        mode = "empty";
        renderer.drawIdle();
        delayTimer = window.setTimeout(begin, LANDING_DELAY_SECONDS * 1000);
        return;
      }
      begin();
    };

    const collect = (side: GatherSide) => {
      cancelAnimationFrame(raf);
      window.clearTimeout(delayTimer);
      const field = usePageTransition.getState().particleField;
      const token = ++playToken;
      notifiedLeave = false;
      blendDuration = 0;
      if (!field) {
        mode = "empty";
        fieldColor = null;
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
      cols = field.cols;
      rows = field.rows;
      vertexCount = field.vertexCount;
      fieldData = packed.data;
      renderer.upload({
        data: packed.data,
        vertexCount: field.vertexCount,
        cols: field.cols,
        rows: field.rows,
      });
      mode = "collecting";
      startedAt = performance.now() / 1000;
      collectLoop(token);
    };

    const applyField = (field: ParticleField | null) => {
      cancelAnimationFrame(raf);
      window.clearTimeout(delayTimer);
      playToken += 1;
      if (!field) {
        mode = "empty";
        fieldColor = null;
        renderer.drawIdle();
        return;
      }
      mode = "idle";
      fieldColor = field.color;
      cols = field.cols;
      rows = field.rows;
      vertexCount = field.vertexCount;
      fieldData = field.data;
      renderer.upload(field);
      renderer.draw(SETTLED_TIME, field.color);
    };

    apiRef.current = { play, collect };
    applyField(usePageTransition.getState().particleField);

    const unsubField = usePageTransition.subscribe((state, prev) => {
      const fieldChanged = state.particleField !== prev.particleField;
      const coverEnded = prev.covering && !state.covering;
      if (!fieldChanged && !coverEnded) return;
      if (state.phase !== "idle") return;
      applyField(state.particleField);
    });

    const unsubColor = usePageColor.subscribe((state, prev) => {
      if (state.current === prev.current && state.previous === prev.previous) {
        return;
      }
      if (reduceMotion) {
        if (mode === "idle") drawSettled();
        return;
      }
      if (mode === "covering") {
        beginColorBlend(state.current);
        return;
      }
      if (mode === "idle") drawSettled();
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
      if (mode === "collecting") {
        if (!fieldColor) return;
        const time = performance.now() / 1000 - startedAt;
        renderer.draw(time, fieldColor, true);
        return;
      }
      uploadCoverParticles();
      const time = performance.now() / 1000 - startedAt;
      renderer.draw(time, sampleDisplayColor());
    });

    return () => {
      running = false;
      apiRef.current = null;
      cancelAnimationFrame(raf);
      window.clearTimeout(delayTimer);
      unsubField();
      unsubColor();
      disconnectResize();
      renderer.destroy();
    };
  }, []);

  useLayoutEffect(() => {
    if (generation === 0) return;
    if (phase === "collecting") {
      apiRef.current?.collect(gatherSide);
      return;
    }
    if (phase !== "covering") return;
    apiRef.current?.play(entryFrom);
  }, [phase, generation, entryFrom, gatherSide]);

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

export default PageCanvas;
