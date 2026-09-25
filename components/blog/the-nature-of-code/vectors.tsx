"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { CVSubHeading } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";

const VX = 10;
const VY = 10;
const AXIS_MAX = 12;

function getOverflowRoot(element: Element): Element | null {
  let parent = element.parentElement;
  while (parent && parent !== document.documentElement) {
    const { overflow, overflowX, overflowY } = getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(`${overflow}${overflowX}${overflowY}`)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function observeElementVisible(
  element: Element,
  onChange: (visible: boolean) => void,
): () => void {
  const observer = new IntersectionObserver(
    ([entry]) => {
      onChange(Boolean(entry?.isIntersecting));
    },
    { root: getOverflowRoot(element) },
  );
  observer.observe(element);
  return () => observer.disconnect();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size: number,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - size * Math.cos(angle - Math.PI / 6),
    toY - size * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - size * Math.cos(angle + Math.PI / 6),
    toY - size * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

export function VectorGraph({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let color = "#1e1e1e";
    let primary = "#f75d5d";
    let muted = "#9a9a9a";

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const padL = 44;
      const padR = 28;
      const padT = 20;
      const padB = 36;
      const availW = Math.max(width - padL - padR, 1);
      const availH = Math.max(height - padT - padB, 1);
      const size = Math.min(availW, availH);
      const scale = size / AXIS_MAX;
      const left = padL + (availW - size) / 2;
      const bottom = padT + (availH + size) / 2;
      const right = left + size;
      const top = bottom - size;
      const originX = left;
      const originY = bottom;

      const toScreen = (x: number, y: number) => ({
        x: originX + x * scale,
        y: originY - y * scale,
      });

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.22;
      for (let i = 1; i <= AXIS_MAX; i += 1) {
        const x = toScreen(i, 0).x;
        const y = toScreen(0, i).y;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (const tick of [0, 5, 10]) {
        const p = toScreen(tick, 0);
        ctx.fillText(String(tick), p.x, bottom + 8);
      }
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (const tick of [5, 10]) {
        const p = toScreen(0, tick);
        ctx.fillText(String(tick), left - 8, p.y);
      }

      const start = toScreen(0, 0);
      const end = toScreen(VX, VY);

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`x = ${VX}`, (start.x + end.x) / 2, start.y + 6);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`y = ${VY}`, end.x + 8, (start.y + end.y) / 2);

      ctx.strokeStyle = primary;
      ctx.fillStyle = primary;
      ctx.lineWidth = 2.25;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      drawArrowHead(ctx, start.x, start.y, end.x, end.y, 12);

      ctx.beginPath();
      ctx.arc(start.x, start.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = primary;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(`v = (${VX}, ${VY})`, end.x + 10, end.y - 6);
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      draw();
    });

    draw();

    return () => {
      disconnectResize();
    };
  }, []);

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Vector · (10, 10)
        </CVSubHeading>
      </div>
      <div className="relative aspect-square w-full sm:aspect-2/1">
        <canvas
          ref={canvasRef}
          aria-label="Cartesian graph of a vector from the origin to ten comma ten"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
        <div className="pointer-events-none absolute inset-0">
          <CVSubHeading className="absolute bottom-1 left-1/2 -translate-x-1/2 italic text-muted-foreground">
            x
          </CVSubHeading>
          <CVSubHeading className="absolute top-1/2 left-2 -translate-x-1/2 -translate-y-1/2 -rotate-90 italic text-muted-foreground">
            y
          </CVSubHeading>
        </div>
      </div>
    </div>
  );
}

const POSITION_X = 50;
const POSITION_Y = 50;
const POSITION_RADIUS = 10;

export function VectorLocationCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let color = "#1e1e1e";
    let primary = "#f75d5d";
    let muted = "#9a9a9a";

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      // Canvas coordinates: origin at top-left, y grows downward — same as the snippet.
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, POSITION_Y);
      ctx.lineTo(POSITION_X, POSITION_Y);
      ctx.lineTo(POSITION_X, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(`x = ${POSITION_X}`, POSITION_X / 2 - 12, POSITION_Y - 6);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`y = ${POSITION_Y}`, POSITION_X + 8, POSITION_Y / 2);

      ctx.strokeStyle = primary;
      ctx.fillStyle = primary;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(POSITION_X, POSITION_Y);
      ctx.stroke();
      drawArrowHead(ctx, 0, 0, POSITION_X, POSITION_Y, 10);

      ctx.beginPath();
      ctx.arc(POSITION_X, POSITION_Y, POSITION_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = primary;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `position = (${POSITION_X}, ${POSITION_Y})`,
        POSITION_X + POSITION_RADIUS + 8,
        POSITION_Y + 4,
      );

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("(0, 0)", 8, 8);
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      draw();
    });

    draw();

    return () => {
      disconnectResize();
    };
  }, []);

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Position · (50, 50)
        </CVSubHeading>
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="Canvas showing a position vector drawing a circle at fifty comma fifty"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const START_X = 50;
const START_Y = 50;
const VELOCITY_X = 1;
const VELOCITY_Y = 1;
const VELOCITY_ARROW_SCALE = 18;

export function VectorVelocityCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const playingRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  playingRef.current = playing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let color = "#1e1e1e";
    let primary = "#f75d5d";
    let muted = "#9a9a9a";
    let raf = 0;
    let running = true;
    let visible = false;
    let x = START_X;
    let y = START_Y;
    let vx = VELOCITY_X;
    let vy = VELOCITY_Y;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const tipX = x + vx * VELOCITY_ARROW_SCALE;
      const tipY = y + vy * VELOCITY_ARROW_SCALE;

      ctx.strokeStyle = muted;
      ctx.fillStyle = muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      drawArrowHead(ctx, x, y, tipX, tipY, 8);

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(`velocity = (${vx}, ${vy})`, tipX + 6, tipY - 4);

      ctx.beginPath();
      ctx.arc(x, y, POSITION_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = primary;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `position = (${Math.round(x)}, ${Math.round(y)})`,
        x + POSITION_RADIUS + 8,
        y + 4,
      );
    };

    const update = () => {
      x += vx;
      y += vy;

      if (x > width - POSITION_RADIUS || x < POSITION_RADIUS) {
        vx *= -1;
        x = Math.min(Math.max(x, POSITION_RADIUS), width - POSITION_RADIUS);
      }
      if (y > height - POSITION_RADIUS || y < POSITION_RADIUS) {
        vy *= -1;
        y = Math.min(Math.max(y, POSITION_RADIUS), height - POSITION_RADIUS);
      }
    };

    const reset = () => {
      x = START_X;
      y = START_Y;
      vx = VELOCITY_X;
      vy = VELOCITY_Y;
      draw();
    };

    resetRef.current = reset;

    const tick = () => {
      raf = 0;
      if (!running || !visible) return;
      if (playingRef.current) {
        update();
        draw();
      }
      raf = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!running || !visible || raf) return;
      raf = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (!raf) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      x = Math.min(
        Math.max(x, POSITION_RADIUS),
        Math.max(width - POSITION_RADIUS, POSITION_RADIUS),
      );
      y = Math.min(
        Math.max(y, POSITION_RADIUS),
        Math.max(height - POSITION_RADIUS, POSITION_RADIUS),
      );
      draw();
    });

    const disconnectVisibility = observeElementVisible(canvas, (isVisible) => {
      visible = isVisible;
      if (visible) {
        startLoop();
        return;
      }
      stopLoop();
    });

    return () => {
      running = false;
      stopLoop();
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, []);

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Position + velocity · (1, 1)
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={
                playing ? "Stop velocity sketch" : "Play velocity sketch"
              }
              onClick={() => setPlaying((current) => !current)}
            >
              {playing ? <Square /> : <Play />}
            </Button>
          </PointerEventHandler>
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label="Reset velocity sketch"
              onClick={() => resetRef.current()}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="Animated canvas of a circle moving by adding a velocity vector each frame"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const ACCEL_X = 0;
const ACCEL_Y = 0.1;
const ACCEL_ARROW_SCALE = 180;

export function VectorAccelerationCanvas({
  className,
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const playingRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  playingRef.current = playing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let color = "#1e1e1e";
    let primary = "#f75d5d";
    let muted = "#9a9a9a";
    let raf = 0;
    let running = true;
    let visible = false;
    let x = START_X;
    let y = START_Y;
    let vx = VELOCITY_X;
    let vy = VELOCITY_Y;
    const ax = ACCEL_X;
    const ay = ACCEL_Y;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const velTipX = x + vx * VELOCITY_ARROW_SCALE;
      const velTipY = y + vy * VELOCITY_ARROW_SCALE;
      const accTipX = x + ax * ACCEL_ARROW_SCALE;
      const accTipY = y + ay * ACCEL_ARROW_SCALE;

      ctx.strokeStyle = muted;
      ctx.fillStyle = muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(velTipX, velTipY);
      ctx.stroke();
      drawArrowHead(ctx, x, y, velTipX, velTipY, 8);
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(
        `velocity = (${vx.toFixed(1)}, ${vy.toFixed(1)})`,
        velTipX + 6,
        velTipY - 4,
      );

      ctx.strokeStyle = primary;
      ctx.fillStyle = primary;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(accTipX, accTipY);
      ctx.stroke();
      drawArrowHead(ctx, x, y, accTipX, accTipY, 8);
      ctx.textBaseline = "top";
      ctx.fillText(`acceleration = (${ax}, ${ay})`, accTipX + 6, accTipY + 4);

      ctx.beginPath();
      ctx.arc(x, y, POSITION_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `position = (${Math.round(x)}, ${Math.round(y)})`,
        x + POSITION_RADIUS + 8,
        y + POSITION_RADIUS + 4,
      );
    };

    const update = () => {
      // velocity += acceleration; position += velocity
      vx += ax;
      vy += ay;
      x += vx;
      y += vy;

      if (x > width - POSITION_RADIUS || x < POSITION_RADIUS) {
        vx *= -1;
        x = Math.min(Math.max(x, POSITION_RADIUS), width - POSITION_RADIUS);
      }
      if (y > height - POSITION_RADIUS || y < POSITION_RADIUS) {
        vy *= -1;
        y = Math.min(Math.max(y, POSITION_RADIUS), height - POSITION_RADIUS);
      }
    };

    const reset = () => {
      x = START_X;
      y = START_Y;
      vx = VELOCITY_X;
      vy = VELOCITY_Y;
      draw();
    };

    resetRef.current = reset;

    const tick = () => {
      raf = 0;
      if (!running || !visible) return;
      if (playingRef.current) {
        update();
        draw();
      }
      raf = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!running || !visible || raf) return;
      raf = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (!raf) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      x = Math.min(
        Math.max(x, POSITION_RADIUS),
        Math.max(width - POSITION_RADIUS, POSITION_RADIUS),
      );
      y = Math.min(
        Math.max(y, POSITION_RADIUS),
        Math.max(height - POSITION_RADIUS, POSITION_RADIUS),
      );
      draw();
    });

    const disconnectVisibility = observeElementVisible(canvas, (isVisible) => {
      visible = isVisible;
      if (visible) {
        startLoop();
        return;
      }
      stopLoop();
    });

    return () => {
      running = false;
      stopLoop();
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, []);

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Position + velocity + acceleration · (0, 0.1)
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={
                playing
                  ? "Stop acceleration sketch"
                  : "Play acceleration sketch"
              }
              onClick={() => setPlaying((current) => !current)}
            >
              {playing ? <Square /> : <Play />}
            </Button>
          </PointerEventHandler>
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label="Reset acceleration sketch"
              onClick={() => resetRef.current()}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="Animated canvas of a circle with velocity changing under constant acceleration"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const INTERACTIVE_ACCEL = 0.15;
const INTERACTIVE_MAX_SPEED = 6;
const INTERACTIVE_ACCEL_SCALE = 120;

function VectorPointerAccelCanvas({
  className,
  mode,
}: {
  className?: string;
  mode: "toward" | "away";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const playingRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  playingRef.current = playing;
  const sign = mode === "toward" ? 1 : -1;
  const title =
    mode === "toward"
      ? "Acceleration toward pointer"
      : "Acceleration away from pointer";
  const accelLabel =
    mode === "toward" ? "acceleration → mouse" : "acceleration ← mouse";
  const ariaLabel =
    mode === "toward"
      ? "Animated canvas of a circle accelerating toward the pointer"
      : "Animated canvas of a circle accelerating away from the pointer";
  const stopLabel =
    mode === "toward" ? "Stop interactivity sketch" : "Stop away sketch";
  const playLabel =
    mode === "toward" ? "Play interactivity sketch" : "Play away sketch";
  const resetLabel =
    mode === "toward" ? "Reset interactivity sketch" : "Reset away sketch";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let color = "#1e1e1e";
    let primary = "#f75d5d";
    let muted = "#9a9a9a";
    let raf = 0;
    let running = true;
    let visible = false;
    let x = START_X;
    let y = START_Y;
    let vx = 0;
    let vy = 0;
    let ax = 0;
    let ay = 0;
    let mouseX = START_X + 120;
    let mouseY = START_Y + 40;
    let hasPointer = false;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      if (hasPointer) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2);
        ctx.fillStyle = muted;
        ctx.fill();
      }

      const velTipX = x + vx * VELOCITY_ARROW_SCALE;
      const velTipY = y + vy * VELOCITY_ARROW_SCALE;
      const accTipX = x + ax * INTERACTIVE_ACCEL_SCALE;
      const accTipY = y + ay * INTERACTIVE_ACCEL_SCALE;

      if (Math.hypot(vx, vy) > 0.05) {
        ctx.strokeStyle = muted;
        ctx.fillStyle = muted;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(velTipX, velTipY);
        ctx.stroke();
        drawArrowHead(ctx, x, y, velTipX, velTipY, 8);
        ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(
          `velocity = (${vx.toFixed(1)}, ${vy.toFixed(1)})`,
          velTipX + 6,
          velTipY - 4,
        );
      }

      if (Math.hypot(ax, ay) > 0.001) {
        ctx.strokeStyle = primary;
        ctx.fillStyle = primary;
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(accTipX, accTipY);
        ctx.stroke();
        drawArrowHead(ctx, x, y, accTipX, accTipY, 8);
        ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(accelLabel, accTipX + 6, accTipY + 4);
      }

      ctx.beginPath();
      ctx.arc(x, y, POSITION_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `position = (${Math.round(x)}, ${Math.round(y)})`,
        x + POSITION_RADIUS + 8,
        y + POSITION_RADIUS + 4,
      );
    };

    const update = () => {
      const dx = mouseX - x;
      const dy = mouseY - y;
      const mag = Math.hypot(dx, dy) || 1;
      ax = (dx / mag) * INTERACTIVE_ACCEL * sign;
      ay = (dy / mag) * INTERACTIVE_ACCEL * sign;

      vx += ax;
      vy += ay;

      const speed = Math.hypot(vx, vy);
      if (speed > INTERACTIVE_MAX_SPEED) {
        vx = (vx / speed) * INTERACTIVE_MAX_SPEED;
        vy = (vy / speed) * INTERACTIVE_MAX_SPEED;
      }

      x += vx;
      y += vy;

      if (x > width - POSITION_RADIUS || x < POSITION_RADIUS) {
        vx *= -0.9;
        x = Math.min(Math.max(x, POSITION_RADIUS), width - POSITION_RADIUS);
      }
      if (y > height - POSITION_RADIUS || y < POSITION_RADIUS) {
        vy *= -0.9;
        y = Math.min(Math.max(y, POSITION_RADIUS), height - POSITION_RADIUS);
      }
    };

    const reset = () => {
      x = width > 0 ? width * 0.25 : START_X;
      y = height > 0 ? height * 0.35 : START_Y;
      vx = 0;
      vy = 0;
      ax = 0;
      ay = 0;
      mouseX = width > 0 ? width * 0.7 : START_X + 120;
      mouseY = height > 0 ? height * 0.55 : START_Y + 40;
      draw();
    };

    resetRef.current = reset;

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
      hasPointer = true;
    };

    const onPointerLeave = () => {
      hasPointer = false;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const tick = () => {
      raf = 0;
      if (!running || !visible) return;
      if (playingRef.current) {
        update();
        draw();
      }
      raf = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!running || !visible || raf) return;
      raf = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (!raf) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      const first = width === 0 || height === 0;
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      if (first) {
        reset();
      } else {
        x = Math.min(
          Math.max(x, POSITION_RADIUS),
          Math.max(width - POSITION_RADIUS, POSITION_RADIUS),
        );
        y = Math.min(
          Math.max(y, POSITION_RADIUS),
          Math.max(height - POSITION_RADIUS, POSITION_RADIUS),
        );
        draw();
      }
    });

    const disconnectVisibility = observeElementVisible(canvas, (isVisible) => {
      visible = isVisible;
      if (visible) {
        startLoop();
        return;
      }
      stopLoop();
    });

    return () => {
      running = false;
      stopLoop();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, [accelLabel, sign]);

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          {title}
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={playing ? stopLabel : playLabel}
              onClick={() => setPlaying((current) => !current)}
            >
              {playing ? <Square /> : <Play />}
            </Button>
          </PointerEventHandler>
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={resetLabel}
              onClick={() => resetRef.current()}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <PointerEventHandler asChild type="hide">
        <div className="relative aspect-2/1 w-full touch-none">
          <canvas
            ref={canvasRef}
            aria-label={ariaLabel}
            className="h-full w-full cursor-crosshair"
            style={CANVAS_STYLE}
          />
        </div>
      </PointerEventHandler>
    </div>
  );
}

export function VectorInteractivityCanvas({
  className,
}: {
  className?: string;
}) {
  return <VectorPointerAccelCanvas className={className} mode="toward" />;
}

export function VectorInteractAwayCanvas({
  className,
}: {
  className?: string;
}) {
  return <VectorPointerAccelCanvas className={className} mode="away" />;
}

const MULTI_BALL_COUNT = 100;

type FleeBall = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export function VectorInteractMultipleAwayCanvas({
  className,
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const playingRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  playingRef.current = playing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let color = "#1e1e1e";
    let primary = "#f75d5d";
    let muted = "#9a9a9a";
    let raf = 0;
    let running = true;
    let visible = false;
    let mouseX = 0;
    let mouseY = 0;
    let hasPointer = false;
    let balls: FleeBall[] = [];

    const spawnBalls = () => {
      balls = Array.from({ length: MULTI_BALL_COUNT }, () => ({
        x:
          Math.random() * Math.max(width - POSITION_RADIUS * 2, 1) +
          POSITION_RADIUS,
        y:
          Math.random() * Math.max(height - POSITION_RADIUS * 2, 1) +
          POSITION_RADIUS,
        vx: 0,
        vy: 0,
      }));
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      if (hasPointer) {
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 6, 0, Math.PI * 2);
        ctx.fillStyle = muted;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }

      for (const ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, POSITION_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = primary;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `${balls.length} balls · accelerate away from pointer`,
        12,
        12,
      );
    };

    const update = () => {
      for (const ball of balls) {
        const dx = mouseX - ball.x;
        const dy = mouseY - ball.y;
        const mag = Math.hypot(dx, dy) || 1;
        const ax = (dx / mag) * INTERACTIVE_ACCEL * -1;
        const ay = (dy / mag) * INTERACTIVE_ACCEL * -1;

        ball.vx += ax;
        ball.vy += ay;

        const speed = Math.hypot(ball.vx, ball.vy);
        if (speed > INTERACTIVE_MAX_SPEED) {
          ball.vx = (ball.vx / speed) * INTERACTIVE_MAX_SPEED;
          ball.vy = (ball.vy / speed) * INTERACTIVE_MAX_SPEED;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x > width - POSITION_RADIUS || ball.x < POSITION_RADIUS) {
          ball.vx *= -0.9;
          ball.x = Math.min(
            Math.max(ball.x, POSITION_RADIUS),
            width - POSITION_RADIUS,
          );
        }
        if (ball.y > height - POSITION_RADIUS || ball.y < POSITION_RADIUS) {
          ball.vy *= -0.9;
          ball.y = Math.min(
            Math.max(ball.y, POSITION_RADIUS),
            height - POSITION_RADIUS,
          );
        }
      }
    };

    const reset = () => {
      spawnBalls();
      mouseX = width * 0.5;
      mouseY = height * 0.5;
      draw();
    };

    resetRef.current = reset;

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
      hasPointer = true;
    };

    const onPointerLeave = () => {
      hasPointer = false;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const tick = () => {
      raf = 0;
      if (!running || !visible) return;
      if (playingRef.current) {
        update();
        draw();
      }
      raf = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!running || !visible || raf) return;
      raf = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (!raf) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      const first = width === 0 || height === 0;
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      if (first || balls.length === 0) {
        reset();
      } else {
        for (const ball of balls) {
          ball.x = Math.min(
            Math.max(ball.x, POSITION_RADIUS),
            Math.max(width - POSITION_RADIUS, POSITION_RADIUS),
          );
          ball.y = Math.min(
            Math.max(ball.y, POSITION_RADIUS),
            Math.max(height - POSITION_RADIUS, POSITION_RADIUS),
          );
        }
        draw();
      }
    });

    const disconnectVisibility = observeElementVisible(canvas, (isVisible) => {
      visible = isVisible;
      if (visible) {
        startLoop();
        return;
      }
      stopLoop();
    });

    return () => {
      running = false;
      stopLoop();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, []);

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Many balls · away from pointer
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={
                playing
                  ? "Stop multiple away sketch"
                  : "Play multiple away sketch"
              }
              onClick={() => setPlaying((current) => !current)}
            >
              {playing ? <Square /> : <Play />}
            </Button>
          </PointerEventHandler>
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label="Reset multiple away sketch"
              onClick={() => resetRef.current()}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <PointerEventHandler asChild type="hide">
        <div className="relative aspect-2/1 w-full touch-none">
          <canvas
            ref={canvasRef}
            aria-label="Animated canvas of many circles accelerating away from the pointer"
            className="h-full w-full cursor-crosshair"
            style={CANVAS_STYLE}
          />
        </div>
      </PointerEventHandler>
    </div>
  );
}

type Vec = { x: number; y: number };

type MathOp =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "magnitude"
  | "normalize"
  | "limit"
  | "heading"
  | "rotate"
  | "lerp"
  | "distance"
  | "angleBetween"
  | "dot"
  | "cross";

const MATH_OPS: ReadonlyArray<{ id: MathOp; label: string }> = [
  { id: "add", label: "add" },
  { id: "subtract", label: "subtract" },
  { id: "multiply", label: "multiply" },
  { id: "divide", label: "divide" },
  { id: "magnitude", label: "magnitude" },
  { id: "normalize", label: "normalize" },
  { id: "limit", label: "limit" },
  { id: "heading", label: "heading" },
  { id: "rotate", label: "rotate" },
  { id: "lerp", label: "lerp" },
  { id: "distance", label: "distance" },
  { id: "angleBetween", label: "angleBetween" },
  { id: "dot", label: "dot" },
  { id: "cross", label: "cross" },
];

function vec(x: number, y: number): Vec {
  return { x, y };
}

function copyVec(v: Vec): Vec {
  return { x: v.x, y: v.y };
}

function addVec(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subVec(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scaleVec(a: Vec, s: number): Vec {
  return { x: a.x * s, y: a.y * s };
}

function magVec(a: Vec): number {
  return Math.hypot(a.x, a.y);
}

function normalizeVec(a: Vec): Vec {
  const m = magVec(a);
  if (m === 0) return { x: 0, y: 0 };
  return { x: a.x / m, y: a.y / m };
}

function limitVec(a: Vec, max: number): Vec {
  const m = magVec(a);
  if (m <= max || m === 0) return copyVec(a);
  return scaleVec(normalizeVec(a), max);
}

function headingVec(a: Vec): number {
  return Math.atan2(a.y, a.x);
}

function rotateVec(a: Vec, angle: number): Vec {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
}

function lerpVec(a: Vec, b: Vec, t: number): Vec {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function distVec(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleBetweenVec(a: Vec, b: Vec): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function dotVec(a: Vec, b: Vec): number {
  return a.x * b.x + a.y * b.y;
}

function crossVec(a: Vec, b: Vec): number {
  return a.x * b.y - a.y * b.x;
}

function formatVec(v: Vec): string {
  return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)})`;
}

function opNeedsB(op: MathOp): boolean {
  return (
    op === "add" ||
    op === "subtract" ||
    op === "lerp" ||
    op === "distance" ||
    op === "angleBetween" ||
    op === "dot" ||
    op === "cross"
  );
}

function opNeedsScalar(op: MathOp): boolean {
  return (
    op === "multiply" ||
    op === "divide" ||
    op === "limit" ||
    op === "rotate" ||
    op === "lerp"
  );
}

function scalarLabel(op: MathOp): string {
  switch (op) {
    case "multiply":
      return "scalar";
    case "divide":
      return "scalar";
    case "limit":
      return "max";
    case "rotate":
      return "angle";
    case "lerp":
      return "amount";
    default:
      return "value";
  }
}

function defaultScalar(op: MathOp): number {
  switch (op) {
    case "multiply":
      return 1.5;
    case "divide":
      return 2;
    case "limit":
      return 60;
    case "rotate":
      return Math.PI / 4;
    case "lerp":
      return 0.5;
    default:
      return 1;
  }
}

function scalarRange(op: MathOp): { min: number; max: number; step: number } {
  switch (op) {
    case "multiply":
      return { min: 0.25, max: 2.5, step: 0.05 };
    case "divide":
      return { min: 1, max: 4, step: 0.05 };
    case "limit":
      return { min: 10, max: 120, step: 1 };
    case "rotate":
      return { min: -Math.PI, max: Math.PI, step: 0.01 };
    case "lerp":
      return { min: 0, max: 1, step: 0.01 };
    default:
      return { min: 0, max: 1, step: 0.01 };
  }
}

function formatScalar(op: MathOp, value: number): string {
  if (op === "rotate") return `${((value * 180) / Math.PI).toFixed(0)}°`;
  if (op === "lerp") return value.toFixed(2);
  if (op === "limit") return value.toFixed(0);
  return value.toFixed(2);
}

function describeResult(op: MathOp, a: Vec, b: Vec, scalar: number): string {
  switch (op) {
    case "add":
      return `a + b = ${formatVec(addVec(a, b))}`;
    case "subtract":
      return `a − b = ${formatVec(subVec(a, b))}`;
    case "multiply":
      return `a × ${scalar.toFixed(2)} = ${formatVec(scaleVec(a, scalar))}`;
    case "divide":
      return `a ÷ ${scalar.toFixed(2)} = ${formatVec(scaleVec(a, 1 / scalar))}`;
    case "magnitude":
      return `|a| = ${magVec(a).toFixed(2)}`;
    case "normalize":
      return `â = ${formatVec(normalizeVec(a))}`;
    case "limit":
      return `limit(${scalar.toFixed(0)}) = ${formatVec(limitVec(a, scalar))}`;
    case "heading":
      return `θ = ${((headingVec(a) * 180) / Math.PI).toFixed(1)}°`;
    case "rotate":
      return `rotate(${formatScalar(op, scalar)}) = ${formatVec(rotateVec(a, scalar))}`;
    case "lerp":
      return `lerp(a, b, ${scalar.toFixed(2)}) = ${formatVec(lerpVec(a, b, scalar))}`;
    case "distance":
      return `distance(a, b) = ${distVec(a, b).toFixed(2)}`;
    case "angleBetween":
      return `angleBetween = ${((angleBetweenVec(a, b) * 180) / Math.PI).toFixed(1)}°`;
    case "dot":
      return `a · b = ${dotVec(a, b).toFixed(2)}`;
    case "cross":
      return `a × b = ${crossVec(a, b).toFixed(2)}`;
  }
}

export function VectorMath({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [op, setOp] = useState<MathOp>("add");
  const [scalar, setScalar] = useState(defaultScalar("add"));
  const [vectorA, setVectorA] = useState<Vec>(() => vec(80, 40));
  const [vectorB, setVectorB] = useState<Vec>(() => vec(30, 70));
  const dragRef = useRef<"a" | "b" | null>(null);
  const stateRef = useRef({ op, scalar, vectorA, vectorB });
  const drawRef = useRef(() => {});
  stateRef.current = { op, scalar, vectorA, vectorB };

  // Redraw when operation / scalar / vectors change (draw lives in a stable canvas effect).
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally sync canvas to React state
  useEffect(() => {
    drawRef.current();
  }, [op, scalar, vectorA, vectorB]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let color = "#1e1e1e";
    let primary = "#f75d5d";
    let muted = "#9a9a9a";
    let originX = 0;
    let originY = 0;
    let scale = 1;

    const toScreen = (v: Vec) => ({
      x: originX + v.x * scale,
      y: originY - v.y * scale,
    });

    const fromScreen = (sx: number, sy: number): Vec => ({
      x: (sx - originX) / scale,
      y: (originY - sy) / scale,
    });

    const drawVector = (
      from: Vec,
      to: Vec,
      stroke: string,
      widthPx: number,
      head = 10,
    ) => {
      const s = toScreen(from);
      const e = toScreen(to);
      ctx.strokeStyle = stroke;
      ctx.fillStyle = stroke;
      ctx.lineWidth = widthPx;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
      if (Math.hypot(e.x - s.x, e.y - s.y) > 4) {
        drawArrowHead(ctx, s.x, s.y, e.x, e.y, head);
      }
    };

    const drawHandle = (v: Vec, stroke: string, label: string) => {
      const p = toScreen(v);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = stroke;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.fillStyle = stroke;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, p.x + 10, p.y - 6);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const {
        op: currentOp,
        scalar: s,
        vectorA: a,
        vectorB: b,
      } = stateRef.current;
      originX = width / 2;
      originY = height / 2;
      scale = Math.min(width, height) / 280;

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, height);
      ctx.stroke();
      ctx.globalAlpha = 1;

      const zero = vec(0, 0);

      if (currentOp === "add") {
        const sum = addVec(a, b);
        drawVector(a, sum, muted, 1.25, 8);
        drawVector(b, sum, muted, 1.25, 8);
        drawVector(zero, a, muted, 1.75, 9);
        drawVector(zero, b, muted, 1.75, 9);
        drawVector(zero, sum, primary, 2.25, 11);
        drawHandle(a, muted, "a");
        drawHandle(b, muted, "b");
        drawHandle(sum, primary, "a+b");
      } else if (currentOp === "subtract") {
        const diff = subVec(a, b);
        drawVector(zero, b, muted, 1.5, 8);
        drawVector(a, addVec(a, scaleVec(b, -1)), muted, 1.25, 8);
        drawVector(zero, a, muted, 1.75, 9);
        drawVector(zero, diff, primary, 2.25, 11);
        drawHandle(a, muted, "a");
        drawHandle(b, muted, "b");
        drawHandle(diff, primary, "a−b");
      } else if (currentOp === "multiply") {
        const scaled = scaleVec(a, s);
        drawVector(zero, a, muted, 1.5, 8);
        drawVector(zero, scaled, primary, 2.25, 11);
        drawHandle(a, muted, "a");
        drawHandle(scaled, primary, "a×s");
      } else if (currentOp === "divide") {
        const scaled = scaleVec(a, 1 / s);
        drawVector(zero, a, muted, 1.5, 8);
        drawVector(zero, scaled, primary, 2.25, 11);
        drawHandle(a, muted, "a");
        drawHandle(scaled, primary, "a÷s");
      } else if (currentOp === "magnitude") {
        drawVector(zero, a, primary, 2.25, 11);
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = muted;
        ctx.beginPath();
        ctx.arc(originX, originY, magVec(a) * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        drawHandle(a, primary, `|a|=${magVec(a).toFixed(1)}`);
      } else if (currentOp === "normalize") {
        const n = scaleVec(normalizeVec(a), 40);
        drawVector(zero, a, muted, 1.5, 8);
        drawVector(zero, n, primary, 2.25, 11);
        drawHandle(a, muted, "a");
        drawHandle(n, primary, "â");
      } else if (currentOp === "limit") {
        const limited = limitVec(a, s);
        drawVector(zero, a, muted, 1.5, 8);
        drawVector(zero, limited, primary, 2.25, 11);
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = muted;
        ctx.beginPath();
        ctx.arc(originX, originY, s * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        drawHandle(a, muted, "a");
        drawHandle(limited, primary, "limited");
      } else if (currentOp === "heading") {
        const angle = headingVec(a);
        drawVector(zero, a, primary, 2.25, 11);
        ctx.strokeStyle = muted;
        ctx.fillStyle = muted;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(originX, originY, 28, 0, -angle, angle > 0);
        ctx.stroke();
        drawHandle(a, primary, `θ=${((angle * 180) / Math.PI).toFixed(0)}°`);
      } else if (currentOp === "rotate") {
        const rotated = rotateVec(a, s);
        drawVector(zero, a, muted, 1.5, 8);
        drawVector(zero, rotated, primary, 2.25, 11);
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(
          originX,
          originY,
          magVec(a) * scale,
          -headingVec(a),
          -headingVec(rotated),
          s < 0,
        );
        ctx.stroke();
        drawHandle(a, muted, "a");
        drawHandle(rotated, primary, "rotated");
      } else if (currentOp === "lerp") {
        const mixed = lerpVec(a, b, s);
        drawVector(zero, a, muted, 1.5, 8);
        drawVector(zero, b, muted, 1.5, 8);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1.25;
        const sa = toScreen(a);
        const sb = toScreen(b);
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(sb.x, sb.y);
        ctx.stroke();
        ctx.setLineDash([]);
        drawVector(zero, mixed, primary, 2.25, 11);
        drawHandle(a, muted, "a");
        drawHandle(b, muted, "b");
        drawHandle(mixed, primary, "lerp");
      } else if (currentOp === "distance") {
        const sa = toScreen(a);
        const sb = toScreen(b);
        drawVector(zero, a, muted, 1.5, 8);
        drawVector(zero, b, muted, 1.5, 8);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(sb.x, sb.y);
        ctx.stroke();
        ctx.setLineDash([]);
        drawHandle(a, muted, "a");
        drawHandle(b, muted, "b");
        ctx.fillStyle = primary;
        ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(
          distVec(a, b).toFixed(1),
          (sa.x + sb.x) / 2,
          (sa.y + sb.y) / 2 - 8,
        );
      } else if (currentOp === "angleBetween") {
        const angle = angleBetweenVec(a, b);
        drawVector(zero, a, muted, 1.5, 8);
        drawVector(zero, b, muted, 1.5, 8);
        drawVector(a, b, primary, 2, 10);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        const mid = toScreen(a);
        ctx.arc(mid.x, mid.y, 24, 0, -angle, angle > 0);
        ctx.stroke();
        drawHandle(a, muted, "a");
        drawHandle(b, muted, "b");
      } else if (currentOp === "dot") {
        const bHat = normalizeVec(b);
        const proj = scaleVec(bHat, dotVec(a, bHat));
        drawVector(zero, b, muted, 1.5, 8);
        drawVector(zero, a, muted, 1.75, 9);
        drawVector(zero, proj, primary, 2.25, 11);
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1.25;
        const sa = toScreen(a);
        const sp = toScreen(proj);
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(sp.x, sp.y);
        ctx.stroke();
        ctx.setLineDash([]);
        drawHandle(a, muted, "a");
        drawHandle(b, muted, "b");
        drawHandle(proj, primary, "proj");
      } else if (currentOp === "cross") {
        const c = crossVec(a, b);
        const sa = toScreen(a);
        const sb = toScreen(b);
        const sum = toScreen(addVec(a, b));
        ctx.fillStyle = primary;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(sa.x, sa.y);
        ctx.lineTo(sum.x, sum.y);
        ctx.lineTo(sb.x, sb.y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        drawVector(zero, a, muted, 1.75, 9);
        drawVector(zero, b, muted, 1.75, 9);
        drawHandle(a, muted, "a");
        drawHandle(b, muted, "b");
        ctx.fillStyle = primary;
        ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`signed area = ${c.toFixed(1)}`, 12, 12);
      }
    };

    const hitTest = (sx: number, sy: number): "a" | "b" | null => {
      const { vectorA: a, vectorB: b, op: currentOp } = stateRef.current;
      const pa = toScreen(a);
      const pb = toScreen(b);
      if (Math.hypot(sx - pa.x, sy - pa.y) <= 14) return "a";
      if (opNeedsB(currentOp) && Math.hypot(sx - pb.x, sy - pb.y) <= 14) {
        return "b";
      }
      return null;
    };

    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = event.clientX - rect.left;
      const sy = event.clientY - rect.top;
      const hit = hitTest(sx, sy);
      if (!hit) return;
      dragRef.current = hit;
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const next = fromScreen(
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
      if (dragRef.current === "a") {
        stateRef.current = { ...stateRef.current, vectorA: next };
        setVectorA(next);
      } else {
        stateRef.current = { ...stateRef.current, vectorB: next };
        setVectorB(next);
      }
      draw();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      draw();
    });

    drawRef.current = draw;
    draw();

    return () => {
      drawRef.current = () => {};
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      disconnectResize();
    };
  }, []);

  const range = scalarRange(op);

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Vector math
        </CVSubHeading>
        <PointerEventHandler asChild type="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Reset vector math vectors"
            onClick={() => {
              const nextA = vec(80, 40);
              const nextB = vec(30, 70);
              const nextScalar = defaultScalar(op);
              setVectorA(nextA);
              setVectorB(nextB);
              setScalar(nextScalar);
            }}
          >
            <RotateCcw />
          </Button>
        </PointerEventHandler>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-3">
        {MATH_OPS.map((item) => (
          <PointerEventHandler key={item.id} asChild type="hide">
            <Button
              type="button"
              variant={op === item.id ? "default" : "outline"}
              size="sm"
              className="h-7 rounded-full px-2.5 font-mono text-[11px]"
              onClick={() => {
                setOp(item.id);
                setScalar(defaultScalar(item.id));
              }}
            >
              {item.label}
            </Button>
          </PointerEventHandler>
        ))}
      </div>

      {opNeedsScalar(op) ? (
        <div className="flex items-center gap-3 border-b border-border px-3 py-2">
          <CVSubHeading className="uppercase text-muted-foreground">
            {scalarLabel(op)}
          </CVSubHeading>
          <PointerEventHandler asChild type="hide">
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={range.step}
              value={scalar}
              onChange={(event) => setScalar(Number(event.target.value))}
              className="h-8 w-full accent-primary"
              aria-label={scalarLabel(op)}
            />
          </PointerEventHandler>
          <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
            {formatScalar(op, scalar)}
          </span>
        </div>
      ) : null}

      <div className="relative aspect-square w-full touch-none sm:aspect-2/1">
        <canvas
          ref={canvasRef}
          aria-label="Interactive canvas showcasing two-dimensional vector math operations"
          className="h-full w-full cursor-crosshair"
          style={CANVAS_STYLE}
        />
      </div>

      <div className="border-t border-border px-3 py-3 font-mono text-xs text-muted-foreground">
        <p>
          a = {formatVec(vectorA)}
          {opNeedsB(op) ? ` · b = ${formatVec(vectorB)}` : null}
        </p>
        <p className="mt-1 text-foreground">
          {describeResult(op, vectorA, vectorB, scalar)}
        </p>
        <p className="mt-1 text-[11px]">Drag handles to move vectors</p>
      </div>
    </div>
  );
}
