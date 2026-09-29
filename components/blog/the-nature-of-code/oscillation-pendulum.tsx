"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { CVSubHeading } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";

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

const TAU = Math.PI * 2;
const PENDULUM_GRAVITY = 0.4;
const PENDULUM_DAMPING = 0.995;
const PENDULUM_START_ANGLE = Math.PI / 4;
const BOB_RADIUS = 14;

/**
 * angularAcceleration = (-gravity / r) · sin(angle).
 * Drag the bob to set the angle; release to let it swing. Forces from the post overlay the bob.
 */
export function PendulumCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const drawRef = useRef(() => {});
  const playingRef = useRef(true);
  const showForcesRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  const [showForces, setShowForces] = useState(true);
  playingRef.current = playing;
  showForcesRef.current = showForces;

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
    let secondary = "#1255cb";
    let muted = "#9a9a9a";
    let background = "#f9f8f5";
    let raf = 0;
    let running = true;
    let visible = false;
    let dragging = false;
    let angle = PENDULUM_START_ANGLE;
    let angularVelocity = 0;
    let angularAcceleration = 0;

    const geometry = () => {
      const pivot = { x: width * 0.5, y: height * 0.12 };
      const r = height * 0.5;
      const forceScale = height * 0.2;
      return { pivot, r, forceScale };
    };

    const haloText = (text: string, x: number, y: number) => {
      ctx.save();
      ctx.strokeStyle = background;
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.strokeText(text, x, y);
      ctx.restore();
      ctx.fillText(text, x, y);
    };

    const drawArrow = (
      fromX: number,
      fromY: number,
      dx: number,
      dy: number,
      stroke: string,
      label: string,
      dashed = false,
      labelDx = 0,
    ) => {
      const length = Math.hypot(dx, dy);
      if (length < 2) return;
      const toX = fromX + dx;
      const toY = fromY + dy;
      ctx.strokeStyle = stroke;
      ctx.fillStyle = stroke;
      ctx.lineWidth = 2;
      ctx.setLineDash(dashed ? [4, 3] : []);
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.setLineDash([]);
      const ux = dx / length;
      const uy = dy / length;
      const head = Math.min(8, length * 0.4);
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - ux * head - uy * head * 0.5,
        toY - uy * head + ux * head * 0.5,
      );
      ctx.lineTo(
        toX - ux * head + uy * head * 0.5,
        toY - uy * head - ux * head * 0.5,
      );
      ctx.closePath();
      ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      haloText(label, toX + ux * 14 + labelDx, toY + uy * 14);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const { pivot, r, forceScale } = geometry();
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      const bob = { x: pivot.x + r * sin, y: pivot.y + r * cos };

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = muted;
      ctx.fillText("angularAcceleration = (-gravity / r) × sin(θ)", 12, 12);
      ctx.fillStyle = color;
      ctx.fillText(
        `θ = ${angle.toFixed(2)} rad  (${((angle * 180) / Math.PI).toFixed(0)}°)`,
        12,
        28,
      );
      ctx.fillText(
        `angularVelocity     = ${angularVelocity.toFixed(4)}`,
        12,
        44,
      );
      ctx.fillText(
        `angularAcceleration = ${angularAcceleration.toFixed(4)}`,
        12,
        60,
      );
      ctx.fillStyle = muted;
      ctx.textBaseline = "bottom";
      ctx.fillText(
        dragging ? "release to let it swing" : "drag the bob",
        12,
        height - 10,
      );

      // Ceiling and rest line
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pivot.x - 60, pivot.y);
      ctx.lineTo(pivot.x + 60, pivot.y);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(pivot.x, pivot.y + r + BOB_RADIUS);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // θ arc between the rest line and the rod
      if (Math.abs(angle) > 0.01) {
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(
          pivot.x,
          pivot.y,
          36,
          Math.PI / 2,
          Math.PI / 2 - angle,
          angle > 0,
        );
        ctx.stroke();
        ctx.fillStyle = primary;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const mid = Math.PI / 2 - angle / 2;
        ctx.fillText(
          "θ",
          pivot.x + Math.cos(mid) * 48,
          pivot.y + Math.sin(mid) * 48,
        );
      }

      // Rod
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(bob.x, bob.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pivot.x, pivot.y, 4, 0, TAU);
      ctx.fillStyle = color;
      ctx.fill();

      // Bob
      ctx.beginPath();
      ctx.arc(bob.x, bob.y, BOB_RADIUS, 0, TAU);
      ctx.fillStyle = dragging ? primary : background;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (showForcesRef.current) {
        // Gravity (straight down) splits into:
        //   F_d = cos(θ) along the rod (away from the pivot)
        //   F_p = sin(θ) perpendicular to the rod (back toward rest)
        // The string pulls back with F_s = -F_d.
        const fg = forceScale;
        const fdX = fg * cos * sin;
        const fdY = fg * cos * cos;
        const fpX = -fg * sin * cos;
        const fpY = fg * sin * sin;
        ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        const side = sin >= 0 ? 1 : -1;
        drawArrow(bob.x, bob.y, 0, fg, color, "F_g", false, -14 * side);
        drawArrow(bob.x, bob.y, fdX, fdY, secondary, "F_d", true, 14 * side);
        drawArrow(bob.x, bob.y, -fdX, -fdY, secondary, "F_s");
        drawArrow(bob.x, bob.y, fpX, fpY, primary, "F_p");
        // Parallelogram guides showing F_d + F_p = F_g
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(bob.x + fdX, bob.y + fdY);
        ctx.lineTo(bob.x, bob.y + fg);
        ctx.lineTo(bob.x + fpX, bob.y + fpY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    };

    drawRef.current = draw;

    const update = () => {
      if (dragging) return;
      const { r } = geometry();
      angularAcceleration = (-PENDULUM_GRAVITY / r) * Math.sin(angle);
      angularVelocity += angularAcceleration;
      angularVelocity *= PENDULUM_DAMPING;
      angle += angularVelocity;
    };

    const reset = () => {
      angle = PENDULUM_START_ANGLE;
      angularVelocity = 0;
      angularAcceleration = 0;
      draw();
    };

    resetRef.current = reset;

    const readAngle = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { pivot } = geometry();
      const x = event.clientX - rect.left - pivot.x;
      const y = event.clientY - rect.top - pivot.y;
      angle = Math.atan2(x, y);
      angularVelocity = 0;
      angularAcceleration = 0;
      draw();
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      readAngle(event);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging) readAngle(event);
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      draw();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

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
      secondary = styles.getPropertyValue("--secondary").trim() || secondary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      background = styles.getPropertyValue("--background").trim() || background;
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
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
      drawRef.current = () => {};
    };
  }, []);

  const toggleForces = () => {
    showForcesRef.current = !showForcesRef.current;
    setShowForces(showForcesRef.current);
    drawRef.current();
  };

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Pendulum
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant={showForces ? "default" : "outline"}
              size="xs"
              className="rounded-full font-mono lowercase"
              aria-pressed={showForces}
              onClick={toggleForces}
            >
              forces
            </Button>
          </PointerEventHandler>
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={
                playing ? "Stop pendulum sketch" : "Play pendulum sketch"
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
              aria-label="Reset pendulum sketch"
              onClick={() => resetRef.current()}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <div className="relative aspect-4/3 w-full touch-none select-none">
        <canvas
          ref={canvasRef}
          aria-label="A swinging pendulum with gravity split into forces along and perpendicular to the string"
          className="h-full w-full cursor-grab active:cursor-grabbing"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const POLAR_START = { r: 3, theta: Math.PI / 6 };

/** One point, two descriptions: polar (r, θ) and cartesian (x, y). Drag to move it. */
export function PolarAndCartesianCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});

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
    let secondary = "#1255cb";
    let muted = "#9a9a9a";
    let background = "#f9f8f5";
    let dragging = false;
    let r = POLAR_START.r;
    let theta = POLAR_START.theta;

    const geometry = () => {
      const unit = Math.min(width, height) / 9;
      const origin = { x: width * 0.5, y: height * 0.5 };
      return { unit, origin };
    };

    const haloText = (text: string, x: number, y: number) => {
      ctx.save();
      ctx.strokeStyle = background;
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.strokeText(text, x, y);
      ctx.restore();
      ctx.fillText(text, x, y);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const { unit, origin } = geometry();
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const px = origin.x + x * unit;
      const py = origin.y - y * unit;

      // Grid
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      for (let gx = origin.x % unit; gx <= width; gx += unit) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
      }
      for (let gy = origin.y % unit; gy <= height; gy += unit) {
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Axes
      ctx.beginPath();
      ctx.moveTo(0, origin.y);
      ctx.lineTo(width, origin.y);
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, height);
      ctx.stroke();
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = muted;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("x", width - 8, origin.y - 4);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("y", origin.x + 6, 8);

      // Cartesian: x and y as horizontal / vertical legs
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(px, origin.y);
      ctx.moveTo(px, origin.y);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = secondary;
      ctx.textAlign = "center";
      ctx.textBaseline = y >= 0 ? "top" : "bottom";
      haloText(
        `x = ${x.toFixed(2)}`,
        (origin.x + px) / 2,
        origin.y + (y >= 0 ? 6 : -6),
      );
      ctx.textAlign = x >= 0 ? "left" : "right";
      ctx.textBaseline = "middle";
      haloText(
        `y = ${y.toFixed(2)}`,
        px + (x >= 0 ? 8 : -8),
        (origin.y + py) / 2,
      );

      // Polar: radius line and angle arc
      ctx.strokeStyle = primary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(px, py);
      ctx.stroke();
      const arcRadius = Math.min(30, r * unit * 0.6);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, arcRadius, 0, -theta, theta > 0);
      ctx.stroke();
      ctx.fillStyle = primary;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const mid = theta / 2;
      haloText(
        "θ",
        origin.x + Math.cos(mid) * (arcRadius + 12),
        origin.y - Math.sin(mid) * (arcRadius + 12),
      );
      const nx = -Math.sin(theta);
      const ny = -Math.cos(theta);
      haloText(
        `r = ${r.toFixed(2)}`,
        (origin.x + px) / 2 + nx * 16,
        (origin.y + py) / 2 + ny * 16,
      );

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, TAU);
      ctx.fillStyle = color;
      ctx.fill();

      // Readouts
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const degrees = (theta * 180) / Math.PI;
      const lines: { text: string; fill: string }[] = [
        {
          text: `r = ${r.toFixed(2)}  θ = ${theta.toFixed(2)} (${degrees.toFixed(0)}°)`,
          fill: primary,
        },
        {
          text: `x = r cos(θ) = ${x.toFixed(2)}`,
          fill: secondary,
        },
        {
          text: `y = r sin(θ) = ${y.toFixed(2)}`,
          fill: secondary,
        },
      ];
      lines.forEach((line, i) => {
        ctx.fillStyle = line.fill;
        haloText(line.text, 12, 12 + i * 16);
      });
      ctx.fillStyle = muted;
      ctx.textBaseline = "bottom";
      haloText("drag the point", 12, height - 10);
    };

    const reset = () => {
      r = POLAR_START.r;
      theta = POLAR_START.theta;
      draw();
    };

    resetRef.current = reset;

    const readPoint = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { unit, origin } = geometry();
      const x = (event.clientX - rect.left - origin.x) / unit;
      const y = (origin.y - (event.clientY - rect.top)) / unit;
      r = Math.hypot(x, y);
      theta = Math.atan2(y, x);
      draw();
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      readPoint(event);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging) readPoint(event);
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
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
      secondary = styles.getPropertyValue("--secondary").trim() || secondary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      background = styles.getPropertyValue("--background").trim() || background;
      draw();
    });

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
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
          Polar · cartesian
        </CVSubHeading>
        <PointerEventHandler asChild type="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Reset coordinates sketch"
            onClick={() => resetRef.current()}
          >
            <RotateCcw />
          </Button>
        </PointerEventHandler>
      </div>
      <div className="relative aspect-4/3 w-full touch-none select-none">
        <canvas
          ref={canvasRef}
          aria-label="A point shown in polar coordinates (radius and angle) and cartesian coordinates (x and y)"
          className="h-full w-full cursor-grab active:cursor-grabbing"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}
