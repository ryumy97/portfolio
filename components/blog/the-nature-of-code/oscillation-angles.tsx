"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Vector2D } from "@/components/blog/the-nature-of-code/vectors";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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

const PI_ROLL_FRAMES = 240;
const PI_HOLD_FRAMES = 120;
const PI_TICKS = 4;

/** A circle of diameter 1 rolls along a number line; its unrolled rim lands on π. */
export function PiCanvas({ className }: { className?: string }) {
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
    let frame = 0;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const margin = 40;
      const unit = Math.min(
        (width - margin * 2) / (PI_TICKS + 0.2),
        height * 0.4,
      );
      const radius = unit * 0.5;
      const x0 = margin;
      const lineY = height * 0.78;

      const rolled = Math.min(frame / PI_ROLL_FRAMES, 1) * Math.PI;
      const cx = x0 + rolled * unit;
      const cy = lineY - radius;
      const theta = (rolled * unit) / radius;
      const markAngle = Math.PI / 2 + theta;
      const markX = cx + Math.cos(markAngle) * radius;
      const markY = cy + Math.sin(markAngle) * radius;

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("circumference = π · diameter  ·  diameter = 1", 12, 12);
      ctx.fillText(`unrolled = ${rolled.toFixed(5)}`, 12, 28);

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 - 12, lineY);
      ctx.lineTo(x0 + PI_TICKS * unit + 12, lineY);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let i = 0; i <= PI_TICKS; i++) {
        const x = x0 + i * unit;
        ctx.beginPath();
        ctx.moveTo(x, lineY - 5);
        ctx.lineTo(x, lineY + 5);
        ctx.stroke();
        ctx.fillText(String(i), x, lineY + 9);
      }

      ctx.strokeStyle = primary;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      if (rolled > 0) {
        ctx.beginPath();
        ctx.moveTo(x0, lineY);
        ctx.lineTo(cx, lineY);
        ctx.stroke();
      }

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (rolled < Math.PI) {
        ctx.strokeStyle = primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, markAngle, Math.PI / 2 + Math.PI * 2);
        ctx.stroke();
      }
      ctx.lineCap = "butt";

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(markX, markY);
      ctx.lineTo(2 * cx - markX, 2 * cy - markY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = muted;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("d = 1", cx, cy - radius - 8);

      ctx.beginPath();
      ctx.arc(markX, markY, 4, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.fill();

      if (rolled >= Math.PI) {
        const piX = x0 + Math.PI * unit;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(piX, lineY - 10);
        ctx.lineTo(piX, lineY + 10);
        ctx.stroke();
        ctx.fillStyle = primary;
        ctx.textBaseline = "top";
        ctx.fillText("π ≈ 3.14159", piX, lineY + 24);
      }
    };

    const update = () => {
      frame += 1;
      if (frame > PI_ROLL_FRAMES + PI_HOLD_FRAMES) frame = 0;
    };

    const reset = () => {
      frame = 0;
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
          Angles · π
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={playing ? "Stop π sketch" : "Play π sketch"}
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
              aria-label="Reset π sketch"
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
          aria-label="A circle of diameter 1 rolling along a number line, unrolling its circumference to π"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const TAU = Math.PI * 2;

const ANGLE_START = Math.PI / 3;

function toUnit(theta: number, radians: boolean) {
  return radians ? theta : (theta * 180) / Math.PI;
}

function fromUnit(value: number, radians: boolean) {
  return radians ? value : (value * Math.PI) / 180;
}

function formatAngle(theta: number, radians: boolean) {
  return toUnit(theta, radians).toFixed(radians ? 3 : 1);
}

function formatRadians(theta: number) {
  return `${theta.toFixed(3)} rad  (${(theta / Math.PI).toFixed(3)}π)`;
}

/** Unit circle on cartesian axes; the chosen angle fills its sector counterclockwise. */
export function DegreesAndRadiansCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const drawRef = useRef(() => {});
  const radiansRef = useRef(true);
  const thetaRef = useRef(ANGLE_START);
  const [radians, setRadians] = useState(true);
  const [theta, setTheta] = useState(ANGLE_START);
  const [draft, setDraft] = useState<string | null>(null);
  radiansRef.current = radians;

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
    let dragging = false;
    let reported = thetaRef.current;

    const geometry = () => {
      const cx = width * 0.5;
      const cy = height * 0.5;
      const radius = height * 0.34;
      return { cx, cy, radius };
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const useRadians = radiansRef.current;
      const theta = thetaRef.current;
      if (theta !== reported) {
        reported = theta;
        setTheta(theta);
      }
      const { cx, cy, radius } = geometry();
      const px = cx + Math.cos(theta) * radius;
      const py = cy - Math.sin(theta) * radius;

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, cy);
      ctx.lineTo(width - 12, cy);
      ctx.moveTo(cx, height - 12);
      ctx.lineTo(cx, 12);
      ctx.stroke();

      ctx.fillStyle = muted;
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      ctx.fillText("x", width - 12, cy - 10);
      ctx.textAlign = "left";
      ctx.fillText("y", cx + 8, 16);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TAU);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, 0, -theta, true);
      ctx.closePath();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = primary;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, -theta, true);
      ctx.stroke();
      ctx.lineCap = "butt";

      const ticks = useRadians
        ? [1, 2, 3, 4, 5, 6].map((value) => ({
            angle: value,
            label: String(value),
          }))
        : Array.from({ length: 12 }, (_, i) => ({
            angle: (i * 30 * Math.PI) / 180,
            label: `${i * 30}°`,
          }));
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.fillStyle = muted;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const tick of ticks) {
        const cos = Math.cos(tick.angle);
        const sin = Math.sin(tick.angle);
        ctx.beginPath();
        ctx.moveTo(cx + cos * (radius - 4), cy - sin * (radius - 4));
        ctx.lineTo(cx + cos * (radius + 4), cy - sin * (radius + 4));
        ctx.stroke();
        ctx.fillText(
          tick.label,
          cx + cos * (radius + 18),
          cy - sin * (radius + 18),
        );
      }
      if (useRadians) {
        const axisLabels = ["0", "π/2", "π", "3π/2"];
        axisLabels.forEach((label, i) => {
          const angle = (i * Math.PI) / 2;
          ctx.fillText(
            label,
            cx + Math.cos(angle) * (radius - 18) + (i === 0 ? -4 : 0),
            cy - Math.sin(angle) * (radius - 18),
          );
        });
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, cy);
      ctx.moveTo(px, py);
      ctx.lineTo(cx, py);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.strokeStyle = primary;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, -theta, true);
      ctx.stroke();
      const mid = theta / 2;
      ctx.fillStyle = primary;
      ctx.fillText(
        useRadians
          ? `${theta.toFixed(2)} rad`
          : `${((theta * 180) / Math.PI).toFixed(0)}°`,
        cx + Math.cos(mid) * 48,
        cy - Math.sin(mid) * 48,
      );

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, TAU);
      ctx.fillStyle = primary;
      ctx.fill();

      ctx.fillStyle = muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const degrees = (theta * 180) / Math.PI;
      ctx.fillText(
        useRadians
          ? `θ = ${formatRadians(theta)}`
          : `θ = ${degrees.toFixed(1)}°`,
        12,
        12,
      );
      ctx.fillText(
        useRadians ? "full turn = 2π rad" : "full turn = 360°",
        12,
        28,
      );
      ctx.fillText(
        `(x, y) = (${Math.cos(theta).toFixed(2)}, ${Math.sin(theta).toFixed(2)})  ·  r = 1`,
        12,
        44,
      );
      ctx.textBaseline = "bottom";
      ctx.fillText("drag or type to set the angle", 12, height - 12);
    };

    drawRef.current = draw;

    const reset = () => {
      thetaRef.current = ANGLE_START;
      draw();
    };

    resetRef.current = reset;

    const readAngle = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { cx, cy } = geometry();
      const x = event.clientX - rect.left - cx;
      const y = cy - (event.clientY - rect.top);
      thetaRef.current = (Math.atan2(y, x) + TAU) % TAU;
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

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      disconnectResize();
      resetRef.current = () => {};
      drawRef.current = () => {};
    };
  }, []);

  const applyAngle = (value: number) => {
    if (!Number.isFinite(value)) return;
    const next = Math.min(Math.max(fromUnit(value, radians), 0), TAU);
    thetaRef.current = next;
    drawRef.current();
  };

  const unitMax = radians ? Number(TAU.toFixed(3)) : 360;
  const unitStep = radians ? 0.01 : 1;

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Angles · {radians ? "radians" : "degrees"}
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase">
              <span className={cn(!radians && "text-foreground")}>Deg</span>
              <Switch
                checked={radians}
                aria-label="Show radians"
                onCheckedChange={(checked) => {
                  radiansRef.current = checked;
                  setRadians(checked);
                  drawRef.current();
                }}
              />
              <span className={cn(radians && "text-foreground")}>Rad</span>
            </div>
          </PointerEventHandler>
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label="Reset angle sketch"
              onClick={() => resetRef.current()}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <div className="flex items-center gap-3 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="font-mono text-foreground">θ</span>
        <Slider
          className="flex-1"
          min={0}
          max={unitMax}
          step={unitStep}
          value={[Math.min(toUnit(theta, radians), unitMax)]}
          aria-label={radians ? "Angle in radians" : "Angle in degrees"}
          onValueChange={([value]) => applyAngle(value)}
        />
        <PointerEventHandler asChild type="hide">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={unitMax}
            step={unitStep}
            value={draft ?? formatAngle(theta, radians)}
            aria-label={radians ? "Angle in radians" : "Angle in degrees"}
            className="h-7 w-20 rounded-md border border-border bg-background px-2 text-right font-mono text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onFocus={(event) => {
              setDraft(event.currentTarget.value);
            }}
            onChange={(event) => {
              setDraft(event.currentTarget.value);
              applyAngle(Number.parseFloat(event.currentTarget.value));
            }}
            onBlur={() => setDraft(null)}
          />
        </PointerEventHandler>
        <span className="w-6 font-mono">{radians ? "rad" : "°"}</span>
      </div>
      <div className="relative aspect-2/1 w-full touch-none">
        <canvas
          ref={canvasRef}
          aria-label="Unit circle on cartesian axes with a sweeping angle, labelled in degrees or radians"
          className="h-full w-full cursor-grab active:cursor-grabbing"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const BOX_ANGULAR_VELOCITY = 0.01;

/** A square rotating around its center — angle grows by a fixed step each frame. */
export function BoxCanvas({ className }: { className?: string }) {
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
    let angle = 0;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const cx = width * 0.5;
      const cy = height * 0.5;
      const size = height * 0.42;
      const wrapped = angle % TAU;

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`angle += ${BOX_ANGULAR_VELOCITY}  (per frame)`, 12, 12);
      ctx.fillText(
        `angle = ${wrapped.toFixed(2)} rad  ·  ${((wrapped * 180) / Math.PI).toFixed(0)}°`,
        12,
        28,
      );

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
      ctx.setLineDash([]);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = primary;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = primary;
      ctx.lineWidth = 2;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size / 2, 0);
      ctx.stroke();
      ctx.restore();

      if (wrapped > 0.001) {
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, wrapped);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, TAU);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = muted;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("center (translate)", cx, cy + size / 2 + 16);
    };

    const update = () => {
      angle += BOX_ANGULAR_VELOCITY;
    };

    const reset = () => {
      angle = 0;
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
          Angular motion · box
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={playing ? "Stop box sketch" : "Play box sketch"}
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
              aria-label="Reset box sketch"
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
          aria-label="A square rotating around its center"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const SPIN_ACCELERATION = 0.002;
const SPIN_DAMPING = 0.99;
const SPIN_DRAG_COEFFICIENT = 0.01;
const SPIN_METER_MAX = 0.2;

/** Fidget spinner — pressing applies angular acceleration; releasing removes it. */
export function BoxPointerEventsCanvas({ className }: { className?: string }) {
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
    let muted = "#9a9a9a";
    let raf = 0;
    let running = true;
    let visible = false;
    let pointerDown = false;
    let angle = 0;
    let aVelocity = 0;
    let aAcceleration = 0;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const cx = width * 0.5;
      const cy = height * 0.5;
      const size = height * 0.42;

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`angle         = ${(angle % TAU).toFixed(2)} rad`, 12, 12);
      ctx.fillText(`aVelocity     = ${aVelocity.toFixed(4)}`, 12, 28);
      ctx.fillText(`aAcceleration = ${aAcceleration.toFixed(4)}`, 12, 44);
      ctx.textBaseline = "bottom";
      ctx.fillText(
        pointerDown ? "holding · accelerating" : "press & hold to spin",
        12,
        height - 12,
      );

      const meterWidth = Math.min(160, width * 0.3);
      const meterX = width - meterWidth - 12;
      const meterY = height - 18;
      ctx.fillStyle = muted;
      ctx.textAlign = "right";
      ctx.fillText("speed", meterX - 8, height - 12);
      ctx.globalAlpha = 0.25;
      ctx.fillRect(meterX, meterY, meterWidth, 4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = primary;
      ctx.fillRect(
        meterX,
        meterY,
        (meterWidth * Math.min(aVelocity, SPIN_METER_MAX)) / SPIN_METER_MAX,
        4,
      );

      if (pointerDown) {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.75, 0, TAU);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = primary;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = primary;
      ctx.lineWidth = 2;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size / 2, 0);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, TAU);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const update = () => {
      aAcceleration = pointerDown ? SPIN_ACCELERATION : 0;
      aAcceleration += aVelocity * aVelocity * SPIN_DRAG_COEFFICIENT * -1;
      aVelocity += aAcceleration;
      aVelocity *= SPIN_DAMPING;
      if (aVelocity < 0.00005) aVelocity = 0;
      angle += aVelocity;
    };

    const reset = () => {
      angle = 0;
      aVelocity = 0;
      aAcceleration = 0;
      draw();
    };

    resetRef.current = reset;

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerUp = (event: PointerEvent) => {
      pointerDown = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const tick = () => {
      raf = 0;
      if (!running || !visible) return;
      update();
      draw();
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
      draw();
    });

    const disconnectVisibility = observeElementVisible(canvas, (isVisible) => {
      visible = isVisible;
      if (visible) {
        startLoop();
        return;
      }
      pointerDown = false;
      stopLoop();
    });

    return () => {
      running = false;
      stopLoop();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
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
          Angular motion · fidget spinner
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label="Reset spinner sketch"
              onClick={() => resetRef.current()}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <div className="relative aspect-2/1 w-full touch-none select-none">
        <canvas
          ref={canvasRef}
          aria-label="A square fidget spinner — press and hold to spin it up, release to let it slow down"
          className="h-full w-full cursor-pointer"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const TRIG_TURN_FRAMES = 720;
const TRIG_TAN_MAX = 2.4;
const TRIG_TAN_COLOR = "#d99a00";

type TrigKey = "sin" | "cos" | "tan";

const TRIG_KEYS: TrigKey[] = ["sin", "cos", "tan"];

/** Unit circle on the left, its sin / cos / tan unwrapped as waves on the right. */
export function SineCosineTangentCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const drawRef = useRef(() => {});
  const playingRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  const [shown, setShown] = useState<Record<TrigKey, boolean>>({
    sin: true,
    cos: true,
    tan: false,
  });
  const shownRef = useRef(shown);
  playingRef.current = playing;
  shownRef.current = shown;

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
    let raf = 0;
    let running = true;
    let visible = false;
    let dragging = false;
    let theta = Math.PI / 4;

    const geometry = () => {
      const radius = Math.min(height * 0.28, width * 0.14);
      const cx = 24 + radius + 28;
      const cy = height * 0.55;
      const gx0 = cx + radius + 48;
      const gx1 = width - 20;
      return { radius, cx, cy, gx0, gx1 };
    };

    const colorOf = (key: TrigKey) =>
      key === "sin" ? primary : key === "cos" ? secondary : TRIG_TAN_COLOR;

    const trigValue = (key: TrigKey, angle: number) =>
      key === "sin"
        ? Math.sin(angle)
        : key === "cos"
          ? Math.cos(angle)
          : Math.tan(angle);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const show = shownRef.current;
      const { radius, cx, cy, gx0, gx1 } = geometry();
      const gw = gx1 - gx0;
      const tanLimit = Math.max(
        1,
        Math.min(TRIG_TAN_MAX, (cy - 52) / radius, (height - cy - 8) / radius),
      );
      const toGraphX = (angle: number) => gx0 + (angle / TAU) * gw;
      const px = cx + Math.cos(theta) * radius;
      const py = cy - Math.sin(theta) * radius;
      const tanValue = Math.tan(theta);
      const tanInRange = Math.abs(tanValue) <= tanLimit;
      const tanY =
        cy - Math.max(-tanLimit, Math.min(tanLimit, tanValue)) * radius;

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";

      // Readouts
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = muted;
      ctx.fillText(
        `θ = ${theta.toFixed(2)} rad  (${((theta * 180) / Math.PI).toFixed(0)}°)`,
        12,
        12,
      );
      let readoutX = 12;
      for (const key of TRIG_KEYS) {
        if (!show[key]) continue;
        const value = trigValue(key, theta);
        const text = `${key} θ = ${Math.abs(value) > 999 ? "∞" : value.toFixed(2)}`;
        ctx.fillStyle = colorOf(key);
        ctx.fillText(text, readoutX, 28);
        readoutX += ctx.measureText(text).width + 16;
      }

      // Circle axes
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius - 16, cy);
      ctx.lineTo(cx + radius + 16, cy);
      ctx.moveTo(cx, cy - radius - 16);
      ctx.lineTo(cx, cy + radius + 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TAU);
      ctx.stroke();

      // Graph axes
      ctx.beginPath();
      ctx.moveTo(gx0, cy);
      ctx.lineTo(gx1, cy);
      ctx.moveTo(gx0, cy - radius - 16);
      ctx.lineTo(gx0, cy + radius + 16);
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("1", gx0 - 6, cy - radius);
      ctx.fillText("-1", gx0 - 6, cy + radius);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const graphTicks = ["π/2", "π", "3π/2", "2π"];
      graphTicks.forEach((label, i) => {
        const x = toGraphX(((i + 1) * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(x, cy - 4);
        ctx.lineTo(x, cy + 4);
        ctx.stroke();
        ctx.fillText(label, x, cy + 8);
      });
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(gx0, cy - radius);
      ctx.lineTo(gx1, cy - radius);
      ctx.moveTo(gx0, cy + radius);
      ctx.lineTo(gx1, cy + radius);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      if (show.tan) {
        ctx.strokeStyle = TRIG_TAN_COLOR;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (const asymptote of [Math.PI / 2, (3 * Math.PI) / 2]) {
          const x = toGraphX(asymptote);
          ctx.moveTo(x, cy - tanLimit * radius);
          ctx.lineTo(x, cy + tanLimit * radius);
        }
        // The line x = 1 that tan θ is measured on
        ctx.moveTo(cx + radius, cy - tanLimit * radius);
        ctx.lineTo(cx + radius, cy + tanLimit * radius);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Curves
      const samples = Math.max(120, Math.floor(gw));
      for (const key of TRIG_KEYS) {
        if (!show[key]) continue;
        ctx.strokeStyle = colorOf(key);
        ctx.lineWidth = 2;
        ctx.beginPath();
        let penDown = false;
        for (let i = 0; i <= samples; i++) {
          const angle = (i / samples) * TAU;
          const value = trigValue(key, angle);
          if (key === "tan" && Math.abs(value) > tanLimit) {
            penDown = false;
            continue;
          }
          const x = toGraphX(angle);
          const y = cy - value * radius;
          if (penDown) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
          penDown = true;
        }
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Traced part of each curve up to θ
      for (const key of TRIG_KEYS) {
        if (!show[key]) continue;
        ctx.strokeStyle = colorOf(key);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let penDown = false;
        const steps = Math.max(2, Math.floor((theta / TAU) * samples));
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * theta;
          const value = trigValue(key, angle);
          if (key === "tan" && Math.abs(value) > tanLimit) {
            penDown = false;
            continue;
          }
          const x = toGraphX(angle);
          const y = cy - value * radius;
          if (penDown) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
          penDown = true;
        }
        ctx.stroke();
      }

      // Triangle legs on the circle
      ctx.lineCap = "round";
      if (show.cos) {
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, cy);
        ctx.stroke();
      }
      if (show.sin) {
        ctx.strokeStyle = primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, cy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      if (show.tan) {
        ctx.strokeStyle = TRIG_TAN_COLOR;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + radius, tanY);
        ctx.stroke();
        ctx.setLineDash([]);
        if (Math.cos(theta) > 0 || tanInRange) {
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx + radius, cy);
          ctx.lineTo(cx + radius, tanY);
          ctx.stroke();
        }
      }
      ctx.lineCap = "butt";

      // Radius and angle arc
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, -theta, true);
      ctx.stroke();

      // Connectors from the circle to the graph
      const markerX = toGraphX(theta);
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      if (show.sin) {
        ctx.moveTo(px, py);
        ctx.lineTo(markerX, py);
      }
      ctx.moveTo(markerX, cy - radius - 16);
      ctx.lineTo(markerX, cy + radius + 16);
      ctx.stroke();
      ctx.setLineDash([]);

      for (const key of TRIG_KEYS) {
        if (!show[key]) continue;
        const value = trigValue(key, theta);
        if (key === "tan" && !tanInRange) continue;
        ctx.beginPath();
        ctx.arc(markerX, cy - value * radius, 4.5, 0, TAU);
        ctx.fillStyle = colorOf(key);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, TAU);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.fillStyle = muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("drag the circle to set θ", 12, height - 12);
    };

    drawRef.current = draw;

    const update = () => {
      if (dragging) return;
      theta = (theta + TAU / TRIG_TURN_FRAMES) % TAU;
    };

    const reset = () => {
      theta = Math.PI / 4;
      draw();
    };

    resetRef.current = reset;

    const readAngle = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { cx, cy, gx0, gx1 } = geometry();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x >= gx0) {
        theta = Math.min(Math.max((x - gx0) / (gx1 - gx0), 0), 1) * TAU;
      } else {
        theta = (Math.atan2(cy - y, x - cx) + TAU) % TAU;
      }
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

  const toggle = (key: TrigKey) => {
    const next = { ...shownRef.current, [key]: !shownRef.current[key] };
    shownRef.current = next;
    setShown(next);
    drawRef.current();
  };

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Sine · cosine · tangent
        </CVSubHeading>
        <div className="flex items-center gap-2">
          {TRIG_KEYS.map((key) => (
            <PointerEventHandler key={key} asChild type="hide">
              <Button
                type="button"
                variant={shown[key] ? "default" : "outline"}
                size="xs"
                className="rounded-full font-mono lowercase"
                aria-pressed={shown[key]}
                onClick={() => toggle(key)}
              >
                {key}
              </Button>
            </PointerEventHandler>
          ))}
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={playing ? "Stop trig sketch" : "Play trig sketch"}
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
              aria-label="Reset trig sketch"
              onClick={() => resetRef.current()}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <div className="relative aspect-2/1 w-full touch-none select-none">
        <canvas
          ref={canvasRef}
          aria-label="Unit circle showing sine, cosine and tangent as lengths, unwrapped into waves on a graph"
          className="h-full w-full cursor-grab active:cursor-grabbing"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

type TriangleSide = "opposite" | "adjacent" | "hypotenuse";

const TRIANGLE_SIDES: TriangleSide[] = ["opposite", "adjacent", "hypotenuse"];

const SOHCAHTOA: Record<
  TrigKey,
  { numerator: TriangleSide; denominator: TriangleSide }
> = {
  sin: { numerator: "opposite", denominator: "hypotenuse" },
  cos: { numerator: "adjacent", denominator: "hypotenuse" },
  tan: { numerator: "opposite", denominator: "adjacent" },
};

const SOLVE_DEFAULTS = {
  degrees: 30,
  known: "hypotenuse" as TriangleSide,
  length: 10,
  find: "opposite" as TriangleSide,
};

/** The ratio that links two sides: o & h → sin, a & h → cos, o & a → tan. */
function ratioFor(a: TriangleSide, b: TriangleSide): TrigKey {
  const pair = new Set([a, b]);
  if (pair.has("opposite") && pair.has("hypotenuse")) return "sin";
  if (pair.has("adjacent") && pair.has("hypotenuse")) return "cos";
  return "tan";
}

function solveTriangle(
  theta: number,
  known: TriangleSide,
  length: number,
): Record<TriangleSide, number> {
  if (known === "hypotenuse") {
    return {
      opposite: length * Math.sin(theta),
      adjacent: length * Math.cos(theta),
      hypotenuse: length,
    };
  }
  if (known === "opposite") {
    return {
      opposite: length,
      adjacent: length / Math.tan(theta),
      hypotenuse: length / Math.sin(theta),
    };
  }
  return {
    opposite: length * Math.tan(theta),
    adjacent: length,
    hypotenuse: length / Math.cos(theta),
  };
}

/** Given θ and one side, SOH CAH TOA picks the ratio that solves for the chosen side. */
export function SohcahtoaCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(() => {});
  const [degrees, setDegrees] = useState(SOLVE_DEFAULTS.degrees);
  const [known, setKnown] = useState<TriangleSide>(SOLVE_DEFAULTS.known);
  const [length, setLength] = useState(SOLVE_DEFAULTS.length);
  const [find, setFind] = useState<TriangleSide>(SOLVE_DEFAULTS.find);
  const [degreesDraft, setDegreesDraft] = useState<string | null>(null);
  const [lengthDraft, setLengthDraft] = useState<string | null>(null);
  const stateRef = useRef({ degrees, known, length, find });
  stateRef.current = { degrees, known, length, find };
  const fn = ratioFor(known, find);

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

    const drawSegments = (
      segments: { text: string; fill: string }[],
      x: number,
      y: number,
    ) => {
      let cursor = x;
      for (const segment of segments) {
        ctx.fillStyle = segment.fill;
        ctx.fillText(segment.text, cursor, y);
        cursor += ctx.measureText(segment.text).width;
      }
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const state = stateRef.current;
      const theta = (state.degrees * Math.PI) / 180;
      const key = ratioFor(state.known, state.find);
      const { numerator, denominator } = SOHCAHTOA[key];
      const lengths = solveTriangle(theta, state.known, state.length);
      const value =
        key === "sin"
          ? Math.sin(theta)
          : key === "cos"
            ? Math.cos(theta)
            : Math.tan(theta);
      const findIsNumerator = state.find === numerator;
      const knownText = state.length.toFixed(2);
      const resultText = lengths[state.find].toFixed(2);
      const sideColor = (side: TriangleSide) =>
        side === state.find
          ? primary
          : side === state.known
            ? secondary
            : muted;

      const segments = [
        [
          { text: `${key} θ = `, fill: color },
          { text: numerator, fill: sideColor(numerator) },
          { text: " / ", fill: muted },
          { text: denominator, fill: sideColor(denominator) },
        ],
        [
          { text: state.find, fill: primary },
          { text: " = ", fill: color },
          { text: state.known, fill: secondary },
          {
            text: findIsNumerator ? ` × ${key} θ` : ` / ${key} θ`,
            fill: color,
          },
        ],
        [
          { text: state.find, fill: primary },
          { text: " = ", fill: color },
          { text: knownText, fill: secondary },
          {
            text: `${findIsNumerator ? " × " : " / "}${key}(${state.degrees}°)`,
            fill: color,
          },
        ],
        [
          { text: state.find, fill: primary },
          { text: " = ", fill: color },
          { text: knownText, fill: secondary },
          {
            text: `${findIsNumerator ? " × " : " / "}${value.toFixed(3)}`,
            fill: color,
          },
        ],
        [
          { text: state.find, fill: primary },
          { text: " = ", fill: color },
          { text: resultText, fill: primary },
        ],
      ];

      ctx.font = "500 13px ui-monospace, SFMono-Regular, Menlo, monospace";
      const widest = Math.max(
        ...segments.map(
          (line) =>
            ctx.measureText(line.map((segment) => segment.text).join("")).width,
        ),
      );
      const formulaSize = Math.max(
        9,
        Math.floor(13 * Math.min(1, (width * 0.46) / widest)),
      );
      const formulaLeft = width - (widest * formulaSize) / 13 - 16;

      // Triangle, scaled to fit whatever the lengths are
      const x0 = width * 0.06 + 8;
      const yb = height * 0.8;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      const oppositeLabelWidth = Math.max(
        ctx.measureText("opposite").width,
        ctx.measureText(
          state.find === "opposite"
            ? `? = ${resultText}`
            : state.known === "opposite"
              ? `${knownText} (given)`
              : lengths.opposite.toFixed(2),
        ).width,
      );
      const areaW = Math.max(40, formulaLeft - x0 - oppositeLabelWidth - 24);
      const areaH = height * 0.62;
      const scale = Math.min(
        areaW / lengths.adjacent,
        areaH / lengths.opposite,
      );
      const O = { x: x0, y: yb };
      const B = { x: x0 + lengths.adjacent * scale, y: yb };
      const C = { x: B.x, y: yb - lengths.opposite * scale };
      const ends: Record<TriangleSide, [typeof O, typeof O]> = {
        adjacent: [O, B],
        opposite: [B, C],
        hypotenuse: [O, C],
      };

      ctx.globalAlpha = 0.08;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(O.x, O.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(C.x, C.y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.lineCap = "round";
      for (const side of TRIANGLE_SIDES) {
        const [from, to] = ends[side];
        const used = side === state.known || side === state.find;
        ctx.strokeStyle = sideColor(side);
        ctx.lineWidth = used ? 4 : 1.5;
        ctx.setLineDash(side === state.find ? [8, 6] : []);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.lineCap = "butt";

      const mark = Math.min(12, (B.x - O.x) * 0.3, (B.y - C.y) * 0.3);
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.strokeRect(B.x - mark, B.y - mark, mark, mark);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(O.x, O.y, 26, -theta, 0);
      ctx.stroke();

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `θ ${state.degrees}°`,
        O.x + 32,
        O.y - Math.max(8, Math.tan(theta / 2) * 32),
      );

      const label = (side: TriangleSide, x: number, y: number) => {
        ctx.fillStyle = sideColor(side);
        ctx.fillText(side, x, y);
        const detail =
          side === state.find
            ? `? = ${resultText}`
            : side === state.known
              ? `${knownText} (given)`
              : lengths[side].toFixed(2);
        ctx.fillText(detail, x, y + 13);
      };
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      label("adjacent", (O.x + B.x) / 2, yb + 8);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      label("opposite", B.x + 10, (B.y + C.y) / 2 - 6);
      ctx.textAlign = "right";
      const nx = -Math.sin(theta);
      const ny = -Math.cos(theta);
      const hypotenuseDetail =
        state.find === "hypotenuse"
          ? `? = ${resultText}`
          : state.known === "hypotenuse"
            ? `${knownText} (given)`
            : lengths.hypotenuse.toFixed(2);
      label(
        "hypotenuse",
        Math.max(
          (O.x + C.x) / 2 + nx * 12 + 2,
          Math.max(
            ctx.measureText("hypotenuse").width,
            ctx.measureText(hypotenuseDetail).width,
          ) + 6,
        ),
        (O.y + C.y) / 2 + ny * 12 - 6,
      );

      ctx.font = `500 ${formulaSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const lineGap = formulaSize + 9;
      const fy = Math.max(40, (height - lineGap * segments.length) / 2);
      segments.forEach((line, i) => {
        drawSegments(line, formulaLeft, fy + i * lineGap);
      });

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      drawSegments(
        [
          { text: "given ", fill: muted },
          { text: `${state.known} ${knownText}`, fill: secondary },
          { text: `  ·  θ ${state.degrees}°  ·  find `, fill: muted },
          { text: state.find, fill: primary },
          { text: `  →  use ${key}`, fill: muted },
        ],
        12,
        12,
      );
    };

    drawRef.current = draw;

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      secondary = styles.getPropertyValue("--secondary").trim() || secondary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      draw();
    });

    return () => {
      disconnectResize();
      drawRef.current = () => {};
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: redraw when inputs change
  useEffect(() => {
    drawRef.current();
  }, [degrees, known, length, find]);

  const chooseKnown = (side: TriangleSide) => {
    setKnown(side);
    if (side === find) {
      setFind(TRIANGLE_SIDES.find((other) => other !== side) ?? "opposite");
    }
  };

  const applyDegrees = (value: number) => {
    if (!Number.isFinite(value)) return;
    setDegrees(Math.min(Math.max(Math.round(value), 1), 89));
  };

  const reset = () => {
    setDegrees(SOLVE_DEFAULTS.degrees);
    setKnown(SOLVE_DEFAULTS.known);
    setLength(SOLVE_DEFAULTS.length);
    setFind(SOLVE_DEFAULTS.find);
    setDegreesDraft(null);
    setLengthDraft(null);
  };

  const inputClass =
    "h-7 w-16 rounded-md border border-border bg-background px-2 text-right font-mono text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  const sideButtons = (
    sides: TriangleSide[],
    selected: TriangleSide,
    onSelect: (side: TriangleSide) => void,
    selectedVariant: "default" | "secondary",
  ) =>
    sides.map((side) => (
      <PointerEventHandler key={side} asChild type="hide">
        <Button
          type="button"
          variant={selected === side ? selectedVariant : "outline"}
          size="xs"
          className="rounded-full font-mono lowercase"
          aria-pressed={selected === side}
          onClick={() => onSelect(side)}
        >
          {side}
        </Button>
      </PointerEventHandler>
    ));

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Solve a right triangle · {fn}
        </CVSubHeading>
        <PointerEventHandler asChild type="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Reset triangle sketch"
            onClick={reset}
          >
            <RotateCcw />
          </Button>
        </PointerEventHandler>
      </div>
      <div className="flex items-center gap-3 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="w-10 font-mono text-foreground">θ</span>
        <Slider
          className="flex-1"
          min={1}
          max={89}
          step={1}
          value={[degrees]}
          aria-label="Angle in degrees"
          onValueChange={([value]) => applyDegrees(value)}
        />
        <PointerEventHandler asChild type="hide">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={89}
            step={1}
            value={degreesDraft ?? degrees}
            aria-label="Angle in degrees"
            className={inputClass}
            onFocus={(event) => setDegreesDraft(event.currentTarget.value)}
            onChange={(event) => {
              setDegreesDraft(event.currentTarget.value);
              applyDegrees(Number.parseFloat(event.currentTarget.value));
            }}
            onBlur={() => setDegreesDraft(null)}
          />
        </PointerEventHandler>
        <span className="w-4 font-mono">°</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-10 uppercase">Given</span>
          {sideButtons(TRIANGLE_SIDES, known, chooseKnown, "secondary")}
          <PointerEventHandler asChild type="hide">
            <input
              type="number"
              inputMode="decimal"
              min={0.1}
              step={0.1}
              value={lengthDraft ?? length}
              aria-label={`Length of the ${known}`}
              className={inputClass}
              onFocus={(event) => setLengthDraft(event.currentTarget.value)}
              onChange={(event) => {
                setLengthDraft(event.currentTarget.value);
                const value = Number.parseFloat(event.currentTarget.value);
                if (Number.isFinite(value) && value > 0) setLength(value);
              }}
              onBlur={() => setLengthDraft(null)}
            />
          </PointerEventHandler>
        </div>
        <div className="flex items-center gap-2">
          <span className="uppercase">Find</span>
          {sideButtons(
            TRIANGLE_SIDES.filter((side) => side !== known),
            find,
            setFind,
            "default",
          )}
        </div>
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="Right triangle solved from an angle and one known side using sine, cosine or tangent"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const INVERSE_DEFAULT_LENGTHS: Record<TriangleSide, number> = {
  opposite: 3,
  adjacent: 4,
  hypotenuse: 5,
};

const INVERSE_NAME: Record<TrigKey, string> = {
  sin: "asin",
  cos: "acos",
  tan: "atan",
};

function fillSegments(
  ctx: CanvasRenderingContext2D,
  segments: { text: string; fill: string }[],
  x: number,
  y: number,
) {
  let cursor = x;
  for (const segment of segments) {
    ctx.fillStyle = segment.fill;
    ctx.fillText(segment.text, cursor, y);
    cursor += ctx.measureText(segment.text).width;
  }
}

/** Given two sides, the inverse function of their ratio recovers θ. */
export function TriangleAngleCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(() => {});
  const [pair, setPair] = useState<TrigKey>("tan");
  const [lengths, setLengths] = useState(INVERSE_DEFAULT_LENGTHS);
  const [drafts, setDrafts] = useState<Partial<Record<TriangleSide, string>>>(
    {},
  );
  const stateRef = useRef({ pair, lengths });
  stateRef.current = { pair, lengths };
  const { numerator, denominator } = SOHCAHTOA[pair];

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

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const state = stateRef.current;
      const key = state.pair;
      const inverse = INVERSE_NAME[key];
      const { numerator, denominator } = SOHCAHTOA[key];
      const top = state.lengths[numerator];
      const bottom = state.lengths[denominator];
      const ratio = top / bottom;

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      if (key !== "tan" && ratio >= 1) {
        ctx.fillStyle = primary;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `the hypotenuse must be longer than the ${numerator}`,
          width / 2,
          height / 2,
        );
        return;
      }

      const theta =
        key === "sin"
          ? Math.asin(ratio)
          : key === "cos"
            ? Math.acos(ratio)
            : Math.atan(ratio);
      const degrees = (theta * 180) / Math.PI;
      const sides = solveTriangle(theta, denominator, bottom);
      const sideColor = (side: TriangleSide) =>
        side === numerator ? primary : side === denominator ? secondary : muted;

      const topText = top.toFixed(2);
      const bottomText = bottom.toFixed(2);
      const segments = [
        [
          { text: `${key} θ = `, fill: color },
          { text: numerator, fill: primary },
          { text: " / ", fill: muted },
          { text: denominator, fill: secondary },
        ],
        [
          { text: "θ", fill: primary },
          { text: ` = ${inverse}(`, fill: color },
          { text: numerator, fill: primary },
          { text: " / ", fill: muted },
          { text: denominator, fill: secondary },
          { text: ")", fill: color },
        ],
        [
          { text: "θ", fill: primary },
          { text: ` = ${inverse}(`, fill: color },
          { text: topText, fill: primary },
          { text: " / ", fill: muted },
          { text: bottomText, fill: secondary },
          { text: ")", fill: color },
        ],
        [
          { text: "θ", fill: primary },
          { text: ` = ${inverse}(${ratio.toFixed(3)})`, fill: color },
        ],
        [
          { text: "θ", fill: primary },
          {
            text: ` = ${theta.toFixed(3)} rad  (${degrees.toFixed(1)}°)`,
            fill: primary,
          },
        ],
      ];

      ctx.font = "500 13px ui-monospace, SFMono-Regular, Menlo, monospace";
      const widest = Math.max(
        ...segments.map(
          (line) =>
            ctx.measureText(line.map((segment) => segment.text).join("")).width,
        ),
      );
      const formulaSize = Math.max(
        9,
        Math.floor(13 * Math.min(1, (width * 0.46) / widest)),
      );
      const formulaLeft = width - (widest * formulaSize) / 13 - 16;

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      const oppositeLabelWidth = Math.max(
        ctx.measureText("opposite").width,
        ctx.measureText(`${sides.opposite.toFixed(2)} (given)`).width,
      );
      const x0 = width * 0.06 + 8;
      const yb = height * 0.8;
      const areaW = Math.max(40, formulaLeft - x0 - oppositeLabelWidth - 24);
      const areaH = height * 0.62;
      const scale = Math.min(areaW / sides.adjacent, areaH / sides.opposite);
      const O = { x: x0, y: yb };
      const B = { x: x0 + sides.adjacent * scale, y: yb };
      const C = { x: B.x, y: yb - sides.opposite * scale };
      const ends: Record<TriangleSide, [typeof O, typeof O]> = {
        adjacent: [O, B],
        opposite: [B, C],
        hypotenuse: [O, C],
      };

      ctx.globalAlpha = 0.08;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(O.x, O.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(C.x, C.y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.lineCap = "round";
      for (const side of TRIANGLE_SIDES) {
        const [from, to] = ends[side];
        const used = side === numerator || side === denominator;
        ctx.strokeStyle = sideColor(side);
        ctx.lineWidth = used ? 4 : 1.5;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
      ctx.lineCap = "butt";

      const mark = Math.min(12, (B.x - O.x) * 0.3, (B.y - C.y) * 0.3);
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.strokeRect(B.x - mark, B.y - mark, mark, mark);

      // The unknown angle — the thing being solved for
      ctx.beginPath();
      ctx.moveTo(O.x, O.y);
      ctx.arc(O.x, O.y, 30, -theta, 0);
      ctx.closePath();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = primary;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(O.x, O.y, 30, -theta, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = primary;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("θ", O.x + 36, O.y - Math.max(8, Math.tan(theta / 2) * 36));

      const detail = (side: TriangleSide) =>
        side === numerator || side === denominator
          ? `${sides[side].toFixed(2)} (given)`
          : sides[side].toFixed(2);
      const label = (side: TriangleSide, x: number, y: number) => {
        ctx.fillStyle = sideColor(side);
        ctx.fillText(side, x, y);
        ctx.fillText(detail(side), x, y + 13);
      };
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      label("adjacent", (O.x + B.x) / 2, yb + 8);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      label("opposite", B.x + 10, (B.y + C.y) / 2 - 6);
      ctx.textAlign = "right";
      const nx = -Math.sin(theta);
      const ny = -Math.cos(theta);
      label(
        "hypotenuse",
        Math.max(
          (O.x + C.x) / 2 + nx * 12 + 2,
          Math.max(
            ctx.measureText("hypotenuse").width,
            ctx.measureText(detail("hypotenuse")).width,
          ) + 6,
        ),
        (O.y + C.y) / 2 + ny * 12 - 6,
      );

      ctx.font = `500 ${formulaSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const lineGap = formulaSize + 9;
      const fy = Math.max(40, (height - lineGap * (segments.length + 1.5)) / 2);
      segments.forEach((line, i) => {
        fillSegments(ctx, line, formulaLeft, fy + i * lineGap);
      });

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = muted;
      ctx.fillText(
        key === "tan"
          ? `Math.atan2(${topText}, ${bottomText}) = ${theta.toFixed(3)}`
          : `Math.${inverse}(${ratio.toFixed(3)}) = ${theta.toFixed(3)}`,
        formulaLeft,
        fy + segments.length * lineGap + 8,
      );

      fillSegments(
        ctx,
        [
          { text: "given ", fill: muted },
          { text: `${numerator} ${topText}`, fill: primary },
          { text: " & ", fill: muted },
          { text: `${denominator} ${bottomText}`, fill: secondary },
          { text: `  →  use ${inverse}`, fill: muted },
        ],
        12,
        12,
      );
    };

    drawRef.current = draw;

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      secondary = styles.getPropertyValue("--secondary").trim() || secondary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      draw();
    });

    return () => {
      disconnectResize();
      drawRef.current = () => {};
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: redraw when inputs change
  useEffect(() => {
    drawRef.current();
  }, [pair, lengths]);

  const reset = () => {
    setPair("tan");
    setLengths(INVERSE_DEFAULT_LENGTHS);
    setDrafts({});
  };

  const inputClass =
    "h-7 w-16 rounded-md border border-border bg-background px-2 text-right font-mono text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  const lengthInput = (side: TriangleSide, tone: string) => (
    <label className="flex items-center gap-2">
      <span className={cn("font-mono lowercase", tone)}>{side}</span>
      <PointerEventHandler asChild type="hide">
        <input
          type="number"
          inputMode="decimal"
          min={0.1}
          step={0.1}
          value={drafts[side] ?? lengths[side]}
          className={inputClass}
          onFocus={(event) => {
            const value = event.currentTarget.value;
            setDrafts((current) => ({ ...current, [side]: value }));
          }}
          onChange={(event) => {
            const raw = event.currentTarget.value;
            setDrafts((current) => ({ ...current, [side]: raw }));
            const value = Number.parseFloat(raw);
            if (Number.isFinite(value) && value > 0) {
              setLengths((current) => ({ ...current, [side]: value }));
            }
          }}
          onBlur={() =>
            setDrafts((current) => ({ ...current, [side]: undefined }))
          }
        />
      </PointerEventHandler>
    </label>
  );

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Find the angle · {INVERSE_NAME[pair]}
        </CVSubHeading>
        <PointerEventHandler asChild type="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Reset angle solver"
            onClick={reset}
          >
            <RotateCcw />
          </Button>
        </PointerEventHandler>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="w-10 uppercase">Given</span>
        {TRIG_KEYS.map((key) => (
          <PointerEventHandler key={key} asChild type="hide">
            <Button
              type="button"
              variant={pair === key ? "default" : "outline"}
              size="xs"
              className="rounded-full font-mono lowercase"
              aria-pressed={pair === key}
              onClick={() => setPair(key)}
            >
              {SOHCAHTOA[key].numerator} + {SOHCAHTOA[key].denominator}
            </Button>
          </PointerEventHandler>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        {lengthInput(numerator, "text-primary")}
        {lengthInput(denominator, "text-secondary")}
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="Right triangle with two known sides; the angle is found with asin, acos or atan"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const ARROW_ACCELERATION = 0.25;
const ARROW_MAX_SPEED = 6;
const ARROW_SIZE = 10;

class Arrow {
  position: Vector2D;
  velocity = new Vector2D(0, 0);
  acceleration = new Vector2D(0, 0);
  size: number;
  angle = 0;

  constructor(position: Vector2D, size: number) {
    this.position = position;
    this.size = size;
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(ARROW_MAX_SPEED);
    this.position.add(this.velocity);
    this.acceleration.set(0, 0);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.moveTo(this.size, 0);
    ctx.lineTo(-this.size / 2, this.size / 2);
    ctx.lineTo(-this.size / 2, -this.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** An arrow accelerates toward the pointer and rotates to face its velocity via atan2. */
export function PointToTargetCanvas({ className }: { className?: string }) {
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
    let raf = 0;
    let running = true;
    let visible = false;
    let arrow = new Arrow(new Vector2D(100, 100), ARROW_SIZE);
    const target = new Vector2D(0, 0);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;
      ctx.fillStyle = color;
      arrow.draw(ctx);
    };

    const update = () => {
      const attraction = target.copy().subtract(arrow.position);
      attraction.normalize().multiply(ARROW_ACCELERATION);
      arrow.acceleration.add(attraction);

      arrow.update();

      arrow.angle = Math.atan2(arrow.velocity.y, arrow.velocity.x);
    };

    const reset = () => {
      arrow = new Arrow(new Vector2D(100, 100), ARROW_SIZE);
      target.set(0, 0);
      draw();
    };

    resetRef.current = reset;

    const onPointerMove = (event: PointerEvent) => {
      target.set(event.offsetX, event.offsetY);
    };

    canvas.addEventListener("pointermove", onPointerMove);

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
      color = getComputedStyle(canvas).color || color;
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
      canvas.removeEventListener("pointermove", onPointerMove);
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
          Pointing to a target
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={playing ? "Stop arrow sketch" : "Play arrow sketch"}
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
              aria-label="Reset arrow sketch"
              onClick={() => resetRef.current()}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <div className="relative aspect-2/1 w-full touch-none">
        <canvas
          ref={canvasRef}
          aria-label="An arrow accelerating toward the pointer, rotated to face the direction it is moving"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}
