"use client";

import { useAnimationFrame } from "motion/react";
import { useEffect, useRef } from "react";
import {
  createScene,
  NET_DEFAULTS,
  type NetSettings,
  type Scene,
} from "./lib/scene";

type Props = {
  settings?: NetSettings;
  isDebug?: boolean;
  resetKey?: number;
};

const NetCanvas = ({
  settings = NET_DEFAULTS,
  isDebug = false,
  resetKey = 0,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const sceneRef = useRef<Scene | null>(null);
  const settingsRef = useRef(settings);
  const isDebugRef = useRef(isDebug);
  const activePointerIdRef = useRef<number | null>(null);
  settingsRef.current = settings;
  isDebugRef.current = isDebug;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const getLocalPoint = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const endPointer = (event: PointerEvent) => {
      if (activePointerIdRef.current !== event.pointerId) return;

      activePointerIdRef.current = null;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      sceneRef.current?.pointerUp();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (activePointerIdRef.current !== null) return;

      const point = getLocalPoint(event.clientX, event.clientY);
      sceneRef.current?.pointerDown(point.x, point.y);
      activePointerIdRef.current = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const point = getLocalPoint(event.clientX, event.clientY);
      sceneRef.current?.setPointer(point.x, point.y, true);

      if (activePointerIdRef.current !== event.pointerId) return;
      sceneRef.current?.pointerMove(point.x, point.y);
    };

    const handlePointerUp = (event: PointerEvent) => {
      endPointer(event);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      endPointer(event);
    };

    const handlePointerLeave = (event: PointerEvent) => {
      if (activePointerIdRef.current === event.pointerId) return;
      sceneRef.current?.setPointer(0, 0, false);
    };

    const handleLostPointerCapture = (event: PointerEvent) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      activePointerIdRef.current = null;
      sceneRef.current?.pointerUp();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerCancel);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("lostpointercapture", handleLostPointerCapture);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerCancel);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener(
        "lostpointercapture",
        handleLostPointerCapture,
      );
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const scale = window.devicePixelRatio;
      dprRef.current = scale;
      canvas.width = container.clientWidth * scale;
      canvas.height = container.clientHeight * scale;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;

      sceneRef.current = createScene(
        container.clientWidth,
        container.clientHeight,
        settingsRef.current,
      );
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (resetKey === 0) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    if (canvas && activePointerIdRef.current !== null) {
      if (canvas.hasPointerCapture(activePointerIdRef.current)) {
        canvas.releasePointerCapture(activePointerIdRef.current);
      }
      activePointerIdRef.current = null;
    }

    sceneRef.current = createScene(
      container.clientWidth,
      container.clientHeight,
      settingsRef.current,
    );
  }, [resetKey]);

  useAnimationFrame(() => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene || scene.width === 0 || scene.height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    scene.syncSettings(settingsRef.current);
    scene.step();

    const dpr = dprRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene.draw(ctx);

    if (isDebugRef.current) {
      scene.drawDebug(ctx);
    }
  });

  return (
    <div className="absolute inset-0 h-full w-full" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
      />
    </div>
  );
};

export default NetCanvas;
