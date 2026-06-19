"use client";

import { useAnimationFrame } from "motion/react";
import type { StaticImageData } from "next/image";
import { useCallback, useEffect, useRef } from "react";
import {
  type AnatomyBlobConfig,
  type AnatomyBlobScene,
  ANATOMY_BLOB_DEFAULTS,
  clipToCircle,
  clipToLoop,
  createAnatomyBlobScene,
  drawAnatomyBlobSceneDebug,
  drawClosedLoopCurve,
  drawCoverImage,
  stepAnatomyBlobScene,
} from "./lib/anatomy-blob-engine";

type Props = {
  images: StaticImageData[];
  pointerImage: StaticImageData;
  config?: AnatomyBlobConfig;
  isDebug?: boolean;
  resetKey?: number;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

export default function BlobCanvas({
  images,
  pointerImage,
  config = ANATOMY_BLOB_DEFAULTS,
  isDebug = false,
  resetKey = 0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dprRef = useRef(1);
  const sceneRef = useRef<AnatomyBlobScene | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const sizeRef = useRef({ width: 0, height: 0 });
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const pointerImageRef = useRef<HTMLImageElement | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  const createScene = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    sceneRef.current = createAnatomyBlobScene(
      container.clientWidth,
      container.clientHeight,
      configRef.current,
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      ...images.map((image) => loadImage(image.src)),
      loadImage(pointerImage.src),
    ])
      .then((loaded) => {
        if (cancelled) return;
        loadedImagesRef.current = loaded.slice(0, images.length);
        pointerImageRef.current = loaded[loaded.length - 1] ?? null;
      })
      .catch(() => {
        loadedImagesRef.current = [];
        pointerImageRef.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [images, pointerImage]);

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

    const resize = () => {
      const scale = window.devicePixelRatio;
      dprRef.current = scale;
      canvas.width = container.clientWidth * scale;
      canvas.height = container.clientHeight * scale;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;

      sizeRef.current = {
        width: container.clientWidth,
        height: container.clientHeight,
      };

      createScene();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const { x, y } = getLocalPoint(e.clientX, e.clientY);
      pointerRef.current = { x, y, active: true };
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    resize();
    window.addEventListener("resize", resize);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("resize", resize);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [createScene]);

  useEffect(() => {
    if (resetKey === 0) return;

    createScene();
    pointerRef.current.active = false;
  }, [resetKey, createScene]);

  useAnimationFrame(() => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    const { width, height } = sizeRef.current;
    if (!canvas || !scene || width === 0 || height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = dprRef.current;
    const pointer = pointerRef.current;
    const loadedImages = loadedImagesRef.current;
    const pointerBallImage = pointerImageRef.current;
    const { pointerBall } = scene;
    const currentConfig = configRef.current;

    stepAnatomyBlobScene(
      scene,
      width,
      height,
      pointer.x,
      pointer.y,
      pointer.active,
      currentConfig,
    );

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    for (const loop of scene.loops) {
      const image = loadedImages[loop.imageIndex] ?? loadedImages[0];

      ctx.save();

      if (image) {
        clipToLoop(ctx, loop.outline);
        drawCoverImage(ctx, image, width, height);
      } else {
        ctx.fillStyle = "#000000";
        drawClosedLoopCurve(ctx, loop.outline);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.save();
    if (pointerBallImage) {
      clipToCircle(ctx, pointerBall.x, pointerBall.y, pointerBall.radius);
      drawCoverImage(ctx, pointerBallImage, width, height);
    } else {
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(pointerBall.x, pointerBall.y, pointerBall.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (isDebug) {
      drawAnatomyBlobSceneDebug(
        ctx,
        scene,
        pointer.x,
        pointer.y,
        pointer.active,
      );
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
