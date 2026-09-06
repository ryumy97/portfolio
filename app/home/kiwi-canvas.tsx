"use client";

import { useEffect, useRef } from "react";
import kiwi from "@/app/projects/kiwi/assets/circle.png";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";
import { pointer } from "@/stores/pointer";

type Body = {
  x: number;
  y: number;
  r: number;
  rotation: number;
  vx: number;
  vy: number;
  ay: number;
  angularV: number;
};

function radiusFor(width: number, height: number) {
  return width < 768
    ? Math.min(width, height) * 0.15
    : Math.min(width * 0.05, height * 0.18);
}

function hitTest(body: Body, x: number, y: number) {
  const dx = x - body.x;
  const dy = y - body.y;
  return dx * dx + dy * dy <= body.r * body.r;
}

const KiwiCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = kiwi.src;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let visible = false;
    let spawned = false;
    let then = 0;
    let grabbing = false;
    let grabDx = 0;
    let grabDy = 0;
    let pointerX = 0;
    let pointerY = 0;
    let activePointerId: number | null = null;

    const body: Body = {
      x: 0,
      y: 0,
      r: 40,
      rotation: Math.PI * 1.1,
      vx: 0,
      vy: 0,
      ay: 0,
      angularV: 0,
    };

    const floorY = () => height - body.r;

    const spawn = () => {
      body.r = radiusFor(width, height);
      body.x = -body.r;
      body.y = floorY();
      body.vx = width * 0.0175;
      body.vy = height * 0.01;
      body.ay = height * 0.005;
      body.angularV = 0;
      body.rotation = Math.PI * 1.1;
      spawned = true;
    };

    const localPoint = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const syncPointer = () => {
      if (grabbing) {
        pointer.hover = true;
        pointer.target.width = 0;
        pointer.target.height = 0;
        return;
      }
      pointer.hover = false;
      pointer.target.width = 12;
      pointer.target.height = 12;
      pointer.target.borderRadius = 9999;
    };

    const step = (ratio: number) => {
      if (grabbing) {
        const xdiff = pointerX - body.x - grabDx;
        const ydiff = pointerY - body.y - grabDy;
        body.vx = xdiff * 0.2 * ratio;
        body.vy = ydiff * 0.2 * ratio;
        body.ay = 0;
        body.angularV *= 0.95 ** ratio;
      }

      body.vy *= 1 - 0.01 * ratio;
      body.vy += body.ay * ratio;
      body.y += body.vy;

      const floor = floorY();
      const onFloor = body.y >= floor;
      if (onFloor) {
        body.y = floor;
        body.vy *= -0.75;
        if (Math.abs(body.vy) < 0.4) body.vy = 0;
      }
      if (body.y < body.r) {
        body.y = body.r;
        body.vy *= -0.75;
      }

      if (onFloor) {
        body.vx *= 1 - 0.05 * ratio;
        body.angularV = body.vx / body.r;
      } else {
        body.vx *= 1 - 0.025 * ratio;
      }

      body.x += body.vx;

      if (body.x + body.r > width && body.vx > 0) {
        body.x = width - body.r;
        body.vx *= -1;
      }
      if (body.x - body.r < 0 && body.vx < 0) {
        body.x = body.r;
        body.vx *= -1;
      }

      body.rotation += body.angularV;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (!spawned) return;

      ctx.save();
      ctx.translate(body.x, body.y);
      ctx.rotate(body.rotation);
      ctx.beginPath();
      ctx.arc(0, 0, body.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, -body.r, -body.r, body.r * 2, body.r * 2);
      } else {
        ctx.fillStyle = "#7ec8c8";
        ctx.fill();
      }
      ctx.restore();
    };

    const loop = (now: number) => {
      if (!running) return;
      const elapsed = then ? now - then : 1000 / 60;
      then = now;
      let ratio = elapsed / (1000 / 60);
      if (ratio > 2) ratio = 2;
      if (visible && spawned) step(ratio);
      draw();
      if (grabbing) syncPointer();
      raf = requestAnimationFrame(loop);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (activePointerId !== null || !spawned) return;
      const point = localPoint(event.clientX, event.clientY);
      if (!hitTest(body, point.x, point.y)) return;
      activePointerId = event.pointerId;
      grabbing = true;
      pointerX = point.x;
      pointerY = point.y;
      grabDx = point.x - body.x;
      grabDy = point.y - body.y;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      syncPointer();
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = localPoint(event.clientX, event.clientY);
      if (activePointerId === event.pointerId && grabbing) {
        pointerX = point.x;
        pointerY = point.y;
        return;
      }
      canvas.style.cursor =
        spawned && hitTest(body, point.x, point.y) ? "grab" : "default";
    };

    const endPointer = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      activePointerId = null;
      grabbing = false;
      body.vx *= 1.5;
      body.vy *= 1.5;
      body.ay = height * 0.005;
      const point = localPoint(event.clientX, event.clientY);
      canvas.style.cursor = hitTest(body, point.x, point.y) ? "grab" : "default";
      syncPointer();
    };

    const onPointerLeave = () => {
      if (grabbing) return;
      canvas.style.cursor = "default";
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      const prevW = width;
      const prevH = height;
      const prevR = body.r;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      body.r = radiusFor(width, height);
      if (spawned && prevW > 0 && prevH > 0) {
        body.x *= width / prevW;
        body.y *= height / prevH;
        body.y += prevR - body.r;
        body.ay = height * 0.005;
      } else if (visible && !spawned && width > 0) {
        spawn();
      }
      draw();
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible && !spawned && width > 0) spawn();
      },
      { threshold: 0.15 },
    );
    observer.observe(canvas);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("pointerleave", onPointerLeave);

    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      disconnectResize();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      pointer.hover = false;
      pointer.target.width = 12;
      pointer.target.height = 12;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Draggable kiwi"
      className="h-full w-full touch-none"
      style={CANVAS_STYLE}
    />
  );
};

export default KiwiCanvas;
