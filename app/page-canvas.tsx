"use client";

import { useLayoutEffect, useRef } from "react";
import { lerp } from "@/lib/math";
import type { Rgb } from "@/lib/page-color";
import {
  createParticleFieldRenderer,
  type GatherSide,
  oppositeGather,
  type ParticleField,
  type ParticleOrigin,
} from "@/lib/page-particle-field";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";
import { usePageColor } from "@/stores/page-color";
import { usePageTransition } from "@/stores/page-transition";

type FieldApi = {
  play: (from: ParticleOrigin) => void;
  collect: (side: GatherSide) => void;
};

const COLOR_BLEND_SECONDS = 0.7;
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
    let fieldColor: ParticleField["color"] | null = null;
    let outgoingColor: ParticleField["color"] | null = null;
    let startedAt = 0;
    let notifiedCover = false;
    let notifiedLeave = false;
    let playToken = 0;
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
      const x = Math.min(1, Math.max(0, t));
      const e = x * x * x * (x * (x * 6 - 15) + 10);
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
      renderer.drawSettled(fieldColor);
    };

    const commitSettledField = () => {
      const color = colors().current;
      fieldColor = color;
      usePageTransition.getState().commitParticleField({ color });
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

    const coverLoop = (token: number) => {
      if (!running || token !== playToken || mode !== "covering") return;
      const time = performance.now() / 1000 - startedAt;
      if (!notifiedLeave && time >= motionAt) {
        notifiedLeave = true;
        usePageTransition.getState().markLeaveStarted();
      }
      renderer.draw(time, sampleDisplayColor(), outgoingColor);
      if (!notifiedCover && time >= revealAt) {
        markCovered();
      }
      if (time < fillEnd) {
        raf = requestAnimationFrame(() => coverLoop(token));
        return;
      }
      mode = "idle";
      if (!notifiedCover) markCovered();
      raf = requestAnimationFrame(() => {
        if (!running || token !== playToken) return;
        markRevealed();
      });
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
      renderer.draw(time, fieldColor);
      raf = requestAnimationFrame(() => collectLoop(token));
    };

    const play = (from: ParticleOrigin) => {
      cancelAnimationFrame(raf);
      window.clearTimeout(delayTimer);
      notifiedCover = false;
      notifiedLeave = false;
      const token = ++playToken;
      const target = colors().current;
      const existing = usePageTransition.getState().particleField;
      if (blendDuration > 0) beginColorBlend(target);
      else snapDisplayColor(target);
      if (reduceMotion) {
        mode = "idle";
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
        const times =
          from !== "all" && existing
            ? renderer.prepareHandoff(oppositeGather(from), from)
            : from === "all"
              ? renderer.prepareExpand()
              : renderer.prepareEnter(from);
        fillEnd = times.fillEnd;
        revealAt = times.revealAt;
        motionAt = times.motionAt;
        if (from !== "all" && existing) {
          fieldColor = existing.color;
          outgoingColor = existing.color;
        } else {
          outgoingColor = null;
        }
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
      fieldColor = field.color;
      const times = renderer.prepareExit(side);
      fillEnd = times.fillEnd;
      motionAt = times.motionAt;
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
      renderer.drawSettled(field.color);
    };

    apiRef.current = { play, collect };
    applyField(usePageTransition.getState().particleField);

    const unsubField = usePageTransition.subscribe((state, prev) => {
      const fieldChanged = state.particleField !== prev.particleField;
      const coverEnded = prev.covering && !state.covering;
      if (!fieldChanged && !coverEnded) return;
      if (state.phase !== "idle") return;
      if (mode === "covering" || mode === "collecting") return;
      if (coverEnded) {
        mode = "idle";
        fieldColor = state.particleField?.color ?? fieldColor;
        return;
      }
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
      const time = performance.now() / 1000 - startedAt;
      if (mode === "collecting") {
        if (!fieldColor) return;
        renderer.draw(time, fieldColor);
        return;
      }
      renderer.draw(time, sampleDisplayColor(), outgoingColor);
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
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-0 h-svh w-full",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="h-full w-full"
        style={CANVAS_STYLE}
      />
    </div>
  );
};

export default PageCanvas;
