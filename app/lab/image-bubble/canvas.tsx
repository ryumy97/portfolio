"use client";

import { useAnimationFrame } from "motion/react";
import type { StaticImageData } from "next/image";
import { useEffect, useRef } from "react";
import { loadOptimizedImages } from "@/lib/webgl";
import { DEFAULT_POINTER, type PointerInput } from "./lib/pointer";
import { createScene, type Scene, type SceneImages } from "./lib/scene";
import {
  IMAGE_BUBBLE_DEFAULTS,
  type ImageBubbleSettings,
} from "./lib/settings";

type Props = {
  settings?: ImageBubbleSettings;
  isDebug?: boolean;
  resetKey?: number;
  blobImages?: StaticImageData[];
  pointerImage?: StaticImageData;
};

const EMPTY_IMAGES: SceneImages = {
  blobImages: [],
  pointerImage: null,
};

const ImageBubbleCanvas = ({
  settings = IMAGE_BUBBLE_DEFAULTS,
  isDebug = false,
  resetKey = 0,
  blobImages = [],
  pointerImage,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const sceneRef = useRef<Scene | null>(null);
  const settingsRef = useRef(settings);
  const isDebugRef = useRef(isDebug);
  const pointerRef = useRef<PointerInput>(DEFAULT_POINTER);
  const imagesRef = useRef<SceneImages>(EMPTY_IMAGES);
  settingsRef.current = settings;
  isDebugRef.current = isDebug;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const getLocalPoint = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const point = getLocalPoint(event.clientX, event.clientY);
      pointerRef.current = { x: point.x, y: point.y, active: true };
    };

    container.addEventListener("pointermove", handlePointerMove);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
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

      pointerRef.current = {
        x: container.clientWidth * 0.5,
        y: container.clientHeight * 0.5,
        active: true,
      };
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (resetKey === 0) return;

    const container = containerRef.current;
    if (!container) return;

    sceneRef.current = createScene(
      container.clientWidth,
      container.clientHeight,
      settingsRef.current,
    );
    pointerRef.current = {
      x: container.clientWidth * 0.5,
      y: container.clientHeight * 0.5,
      active: true,
    };
  }, [resetKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || blobImages.length === 0) {
      imagesRef.current = EMPTY_IMAGES;
      return;
    }

    let cancelled = false;

    const loadImages = async () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const sources = pointerImage ? [...blobImages, pointerImage] : blobImages;
      const loaded = await loadOptimizedImages(sources, width, height, 90);

      if (cancelled) return;

      imagesRef.current = {
        blobImages: loaded.slice(0, blobImages.length),
        pointerImage: pointerImage ? (loaded[blobImages.length] ?? null) : null,
      };
    };

    void loadImages();

    return () => {
      cancelled = true;
    };
  }, [blobImages, pointerImage]);

  useAnimationFrame(() => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene || scene.width === 0 || scene.height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    scene.syncSettings(settingsRef.current);
    scene.step(pointerRef.current);

    const dpr = dprRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const images =
      imagesRef.current.blobImages.length > 0 ? imagesRef.current : undefined;
    scene.draw(ctx, pointerRef.current, images);

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

export default ImageBubbleCanvas;
