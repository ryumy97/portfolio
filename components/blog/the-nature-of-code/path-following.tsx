"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VehicleBody } from "@/components/blog/the-nature-of-code/autonomous-agents";
import { Vector2D } from "@/components/blog/the-nature-of-code/vectors";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { CVSubHeading } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";

/** Pixels per unit on the grid. */
const DOT_UNIT = 40;
const DOT_HANDLE_RADIUS = 7;
const DOT_GRAB_RADIUS = 18;
const DOT_DEFAULT_A = new Vector2D(3, 1);
const DOT_DEFAULT_B = new Vector2D(1, 2);

function drawVectorArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const head = 9;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - head * Math.cos(angle - Math.PI / 7),
    toY - head * Math.sin(angle - Math.PI / 7),
  );
  ctx.lineTo(
    toX - head * Math.cos(angle + Math.PI / 7),
    toY - head * Math.sin(angle + Math.PI / 7),
  );
  ctx.closePath();
  ctx.fill();
}

type VectorOperation = "add" | "multiply" | "dot";

const DOT_DEFAULT_K = 1.5;

const VECTOR_OPERATIONS: { id: VectorOperation; label: string }[] = [
  { id: "add", label: "a + b" },
  { id: "multiply", label: "a × k" },
  { id: "dot", label: "a · b" },
];

/** Two draggable vectors, comparing vector addition, scalar multiplication and the dot product. */
export function DotProduct({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const drawRef = useRef(() => {});
  const [operation, setOperation] = useState<VectorOperation>("dot");
  const operationRef = useRef<VectorOperation>(operation);
  operationRef.current = operation;

  useEffect(() => {
    void operation;
    drawRef.current();
  }, [operation]);

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
    // In grid units, with y pointing up
    const a = DOT_DEFAULT_A.copy();
    const b = DOT_DEFAULT_B.copy();
    let k = DOT_DEFAULT_K;
    let dragging: "a" | "b" | "k" | null = null;

    const origin = () => ({ x: width / 2, y: height * 0.62 });
    const toScreen = (v: Vector2D) => {
      const o = origin();
      return { x: o.x + v.x * DOT_UNIT, y: o.y - v.y * DOT_UNIT };
    };
    const scaledA = () => a.copy().multiply(k);

    /** The draggable tips for the current operation. */
    const handles = () =>
      operationRef.current === "multiply"
        ? ([
            ["a", a],
            ["k", scaledA()],
          ] as const)
        : ([
            ["a", a],
            ["b", b],
          ] as const);

    const drawGrid = () => {
      const o = origin();
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      for (let x = o.x % DOT_UNIT; x < width; x += DOT_UNIT) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = o.y % DOT_UNIT; y < height; y += DOT_UNIT) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, o.y);
      ctx.lineTo(width, o.y);
      ctx.moveTo(o.x, 0);
      ctx.lineTo(o.x, height);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    /** Dotted line through the origin along v, extended both ways. */
    const drawLineAlong = (v: Vector2D) => {
      const o = origin();
      const unit = v.copy().normalize();
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(o.x - unit.x * width, o.y + unit.y * width);
      ctx.lineTo(o.x + unit.x * width, o.y - unit.y * width);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const arrow = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      stroke: string,
      lineWidth = 2,
      alpha = 1,
    ) => {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = stroke;
      ctx.fillStyle = stroke;
      ctx.lineWidth = lineWidth;
      drawVectorArrow(ctx, from.x, from.y, to.x, to.y);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    };

    const label = (
      text: string,
      at: { x: number; y: number },
      fill: string,
    ) => {
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillStyle = fill;
      ctx.fillText(text, at.x + 10, at.y - 10);
    };

    const readouts = (lines: [string, string][]) => {
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      lines.forEach(([text, fill], index) => {
        ctx.fillStyle = fill;
        ctx.fillText(text, 12, 12 + index * 16);
      });
    };

    const f = (n: number) => n.toFixed(1);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      drawGrid();
      const o = origin();
      const aScreen = toScreen(a);
      const bScreen = toScreen(b);
      const op = operationRef.current;

      if (op === "add") {
        const sum = a.copy().add(b);
        const sumScreen = toScreen(sum);

        // b moved to start at a's tip, tip to tail
        ctx.setLineDash([4, 4]);
        arrow(aScreen, sumScreen, primary, 1.5, 0.6);
        ctx.setLineDash([]);

        arrow(o, sumScreen, color, 4, 0.35);
        arrow(o, aScreen, color);
        arrow(o, bScreen, primary);
        label("a", aScreen, color);
        label("b", bScreen, primary);
        label("a + b", sumScreen, color);

        readouts([
          [
            `a + b = (${f(a.x)} + ${f(b.x)}, ${f(a.y)} + ${f(b.y)}) = (${f(sum.x)}, ${f(sum.y)})`,
            color,
          ],
          ["the result is a vector: b placed at the end of a", muted],
        ]);
      } else if (op === "multiply") {
        const scaled = scaledA();
        const scaledScreen = toScreen(scaled);
        if (a.magnitude() > 0) drawLineAlong(a);

        arrow(o, scaledScreen, primary, 4, 0.6);
        arrow(o, aScreen, color);
        label("a", aScreen, color);
        label(`a × ${f(k)}`, scaledScreen, primary);

        readouts([
          [
            `a × k = (${f(a.x)} × ${f(k)}, ${f(a.y)} × ${f(k)}) = (${f(scaled.x)}, ${f(scaled.y)})`,
            color,
          ],
          [
            k < 0
              ? "the result is a vector: a flipped and scaled"
              : "the result is a vector: a stretched or shrunk",
            muted,
          ],
          ["drag the red tip along the line to change k", muted],
        ]);
      } else {
        const dot = a.dot(b);
        const aLength = a.magnitude();
        const bLength = b.magnitude();

        // Projection of b onto a: the part of b that points along a
        if (aLength > 0) {
          const projection = a.copy().multiply(dot / (aLength * aLength));
          const pScreen = toScreen(projection);
          drawLineAlong(a);

          ctx.strokeStyle = muted;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(bScreen.x, bScreen.y);
          ctx.lineTo(pScreen.x, pScreen.y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.strokeStyle = primary;
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.moveTo(o.x, o.y);
          ctx.lineTo(pScreen.x, pScreen.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.lineWidth = 1;
        }

        // Angle between the vectors
        let angle = 0;
        if (aLength > 0 && bLength > 0) {
          const angleA = Math.atan2(-a.y, a.x);
          const angleB = Math.atan2(-b.y, b.x);
          let delta = angleB - angleA;
          while (delta > Math.PI) delta -= Math.PI * 2;
          while (delta < -Math.PI) delta += Math.PI * 2;
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.arc(o.x, o.y, 22, angleA, angleA + delta, delta < 0);
          ctx.stroke();
          angle = Math.acos(
            Math.min(1, Math.max(-1, dot / (aLength * bLength))),
          );
        }

        arrow(o, aScreen, color);
        arrow(o, bScreen, primary);
        // Labelled the other way round so `a` is projected onto `b`, as in the post
        label("b", aScreen, color);
        label("a", bScreen, primary);

        readouts([
          [
            `a · b = ${f(b.x)} × ${f(a.x)} + ${f(b.y)} × ${f(a.y)} = ${dot.toFixed(2)}`,
            color,
          ],
          [
            `|a| |b| cos θ = ${bLength.toFixed(2)} × ${aLength.toFixed(2)} × cos ${((angle * 180) / Math.PI).toFixed(0)}° = ${(aLength * bLength * Math.cos(angle)).toFixed(2)}`,
            muted,
          ],
          [
            `the result is a number: ${
              Math.abs(dot) < 0.05
                ? "0, perpendicular"
                : dot > 0
                  ? "positive, pointing the same way"
                  : "negative, pointing opposite ways"
            }`,
            muted,
          ],
        ]);
      }

      // Drag handles
      for (const [name, v] of handles()) {
        const screen = toScreen(v);
        ctx.fillStyle = name === "a" ? color : primary;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, DOT_HANDLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    drawRef.current = draw;

    const pointerToUnits = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const o = origin();
      return new Vector2D(
        (event.clientX - rect.left - o.x) / DOT_UNIT,
        -(event.clientY - rect.top - o.y) / DOT_UNIT,
      );
    };
    // Snap to tenths so the readouts stay tidy
    const snap = (n: number) => Math.round(n * 10) / 10;

    const nearestHandle = (point: Vector2D) => {
      let best: "a" | "b" | "k" | null = null;
      let bestDistance = DOT_GRAB_RADIUS;
      for (const [name, v] of handles()) {
        const distance = Math.hypot(point.x - v.x, point.y - v.y) * DOT_UNIT;
        if (distance <= bestDistance) {
          best = name;
          bestDistance = distance;
        }
      }
      return best;
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = nearestHandle(pointerToUnits(event));
      if (!dragging) return;
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = pointerToUnits(event);
      if (!dragging) {
        canvas.style.cursor = nearestHandle(point) ? "grab" : "";
        return;
      }
      if (dragging === "k") {
        // k is how far along a the pointer is, measured in lengths of a
        const lengthSquared = a.x * a.x + a.y * a.y;
        if (lengthSquared > 0) k = snap(point.dot(a) / lengthSquared);
      } else {
        (dragging === "a" ? a : b).set(snap(point.x), snap(point.y));
      }
      canvas.style.cursor = "grabbing";
      draw();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = null;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    resetRef.current = () => {
      a.set(DOT_DEFAULT_A.x, DOT_DEFAULT_A.y);
      b.set(DOT_DEFAULT_B.x, DOT_DEFAULT_B.y);
      k = DOT_DEFAULT_K;
      draw();
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

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Vector operations
        </CVSubHeading>
        <div className="flex items-center gap-2">
          {VECTOR_OPERATIONS.map(({ id, label }) => (
            <PointerEventHandler key={id} asChild type="hide">
              <Button
                type="button"
                variant={operation === id ? "secondary" : "outline"}
                size="sm"
                className="rounded-full font-mono"
                aria-pressed={operation === id}
                onClick={() => setOperation(id)}
              >
                {label}
              </Button>
            </PointerEventHandler>
          ))}
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label="Reset vector operations sketch"
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
          aria-label="Two vectors a and b from the same origin with draggable tips, comparing vector addition and scalar multiplication, which give vectors, with the dot product, which gives a number"
          className="h-full w-full touch-none"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const PATH_HANDLE_RADIUS = 6;
const PATH_GRAB_RADIUS = 18;
/** Default end points, as fractions of the canvas size. */
const PATH_DEFAULT_START = new Vector2D(0.12, 0.35);
const PATH_DEFAULT_END = new Vector2D(0.88, 0.65);

/** Matches the Path in the path following post: two points joined by a line. */
export class PathBody {
  start: Vector2D;
  end: Vector2D;

  constructor(start: Vector2D, end: Vector2D) {
    this.start = start;
    this.end = end;
  }

  draw(ctx: CanvasRenderingContext2D, stroke: string) {
    ctx.strokeStyle = stroke;
    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.stroke();
  }

  direction() {
    return Vector2D.sub(this.end, this.start).normalize();
  }

  normalPoint(futurePosition: Vector2D) {
    const a = Vector2D.sub(futurePosition, this.start);
    const unitB = this.direction();
    const d = a.dot(unitB);
    const normalOnPath = unitB.multiply(d);
    return Vector2D.add(this.start, normalOnPath);
  }
}

/** A path from start to end, with both end points draggable. */
export function Path({ className }: { className?: string }) {
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
    let muted = "#9a9a9a";
    const path = new PathBody(new Vector2D(0, 0), new Vector2D(0, 0));
    let dragging: Vector2D | null = null;

    const placeDefault = () => {
      path.start.set(
        PATH_DEFAULT_START.x * width,
        PATH_DEFAULT_START.y * height,
      );
      path.end.set(PATH_DEFAULT_END.x * width, PATH_DEFAULT_END.y * height);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      ctx.lineWidth = 2;
      path.draw(ctx, color);
      ctx.lineWidth = 1;

      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      for (const [name, point] of [
        ["start", path.start],
        ["end", path.end],
      ] as const) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, PATH_HANDLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = muted;
        ctx.fillText(name, point.x, point.y - 18);
      }
    };

    const pointerPosition = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return new Vector2D(
        Math.min(width, Math.max(0, event.clientX - rect.left)),
        Math.min(height, Math.max(0, event.clientY - rect.top)),
      );
    };

    const nearestEnd = (point: Vector2D) => {
      const toStart = Vector2D.sub(point, path.start).magnitude();
      const toEnd = Vector2D.sub(point, path.end).magnitude();
      if (Math.min(toStart, toEnd) > PATH_GRAB_RADIUS) return null;
      return toStart <= toEnd ? path.start : path.end;
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = nearestEnd(pointerPosition(event));
      if (!dragging) return;
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = pointerPosition(event);
      if (!dragging) {
        canvas.style.cursor = nearestEnd(point) ? "grab" : "";
        return;
      }
      dragging.set(point);
      canvas.style.cursor = "grabbing";
      draw();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = null;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    resetRef.current = () => {
      placeDefault();
      draw();
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      const first = width === 0 || height === 0;
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      if (first) placeDefault();
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
          Path
        </CVSubHeading>
        <PointerEventHandler asChild type="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Reset path sketch"
            onClick={() => resetRef.current()}
          >
            <RotateCcw />
          </Button>
        </PointerEventHandler>
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="A straight path drawn as a line between a start point and an end point. Drag either point to move the path"
          className="h-full w-full touch-none"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const NORMAL_LOOKAHEAD = 70;
const NORMAL_DEFAULT_VEHICLE = new Vector2D(0.3, 0.18);
const NORMAL_DEFAULT_HEADING = new Vector2D(1, 0.15);

/**
 * Finds the normal point from the vehicle's future position onto the path,
 * by projecting `future - start` onto the path direction.
 */
export function Normal({ className }: { className?: string }) {
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
    const path = new PathBody(new Vector2D(0, 0), new Vector2D(0, 0));
    const vehicle = new Vector2D(0, 0);
    const future = new Vector2D(0, 0);
    let dragging: "start" | "end" | "vehicle" | "future" | null = null;

    const placeDefault = () => {
      path.start.set(
        PATH_DEFAULT_START.x * width,
        PATH_DEFAULT_START.y * height,
      );
      path.end.set(PATH_DEFAULT_END.x * width, PATH_DEFAULT_END.y * height);
      vehicle.set(
        NORMAL_DEFAULT_VEHICLE.x * width,
        NORMAL_DEFAULT_VEHICLE.y * height,
      );
      future
        .set(NORMAL_DEFAULT_HEADING)
        .normalize()
        .multiply(NORMAL_LOOKAHEAD)
        .add(vehicle);
    };

    const handles = () =>
      [
        ["start", path.start],
        ["end", path.end],
        ["vehicle", vehicle],
        ["future", future],
      ] as const;

    const arrow = (from: Vector2D, to: Vector2D, stroke: string) => {
      ctx.strokeStyle = stroke;
      ctx.fillStyle = stroke;
      drawVectorArrow(ctx, from.x, from.y, to.x, to.y);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const a = Vector2D.sub(future, path.start);
      const pathVector = Vector2D.sub(path.end, path.start);
      const pathLength = pathVector.magnitude();
      const b = pathVector.copy();
      if (pathLength > 0) b.normalize();
      const along = a.dot(b);
      const normal = b.copy().multiply(along).add(path.start);
      const distance = Vector2D.sub(future, normal).magnitude();
      const offPath = along < 0 || along > pathLength;

      // The path, extended as a dotted line so off-segment normals stay visible
      if (pathLength > 0) {
        ctx.strokeStyle = muted;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(
          path.start.x - b.x * (width + height),
          path.start.y - b.y * (width + height),
        );
        ctx.lineTo(
          path.start.x + b.x * (width + height),
          path.start.y + b.y * (width + height),
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.lineWidth = 2;
      path.draw(ctx, color);
      ctx.lineWidth = 1;

      // b × (a · b): the part of a that runs along the path
      ctx.strokeStyle = primary;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(path.start.x, path.start.y);
      ctx.lineTo(normal.x, normal.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;

      arrow(path.start, future, muted);

      // The normal from the future position to the path
      ctx.strokeStyle = primary;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(future.x, future.y);
      ctx.lineTo(normal.x, normal.y);
      ctx.stroke();
      ctx.setLineDash([]);

      if (distance > 12 && pathLength > 0) {
        const toFuture = Vector2D.sub(future, normal).normalize().multiply(9);
        const back = b.copy().multiply(along > 0 ? -9 : 9);
        ctx.strokeStyle = primary;
        ctx.beginPath();
        ctx.moveTo(normal.x + toFuture.x, normal.y + toFuture.y);
        ctx.lineTo(
          normal.x + toFuture.x + back.x,
          normal.y + toFuture.y + back.y,
        );
        ctx.lineTo(normal.x + back.x, normal.y + back.y);
        ctx.stroke();
      }

      // Vehicle and its velocity towards the future position
      ctx.strokeStyle = muted;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(vehicle.x, vehicle.y);
      ctx.lineTo(future.x, future.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const heading = Math.atan2(future.y - vehicle.y, future.x - vehicle.x);
      ctx.save();
      ctx.translate(vehicle.x, vehicle.y);
      ctx.rotate(heading);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, 6);
      ctx.lineTo(-8, -6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      for (const [name, point] of handles()) {
        if (name === "vehicle") {
          ctx.fillStyle = muted;
          ctx.fillText(name, point.x, point.y - 18);
          continue;
        }
        ctx.fillStyle = name === "future" ? primary : color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, PATH_HANDLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = muted;
        ctx.fillText(name, point.x, point.y - 18);
      }

      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.arc(normal.x, normal.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("normal", normal.x, normal.y + 18);

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const lines: [string, string][] = [
        ["a = future − start", muted],
        ["b = (end − start).normalize()", muted],
        [`normal = start + b × (a · b), a · b = ${along.toFixed(0)}`, color],
        [
          `distance = |future − normal| = ${distance.toFixed(0)}px${
            offPath ? " (beyond the path's ends)" : ""
          }`,
          color,
        ],
      ];
      lines.forEach(([text, fill], i) => {
        ctx.fillStyle = fill;
        ctx.fillText(text, 12, height - 12 - (lines.length - i) * 16);
      });
    };

    const pointerPosition = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return new Vector2D(
        Math.min(width, Math.max(0, event.clientX - rect.left)),
        Math.min(height, Math.max(0, event.clientY - rect.top)),
      );
    };

    const nearestHandle = (point: Vector2D) => {
      let nearest: (typeof dragging & string) | null = null;
      let best = PATH_GRAB_RADIUS;
      for (const [name, handle] of handles()) {
        const d = Vector2D.sub(point, handle).magnitude();
        if (d <= best) {
          best = d;
          nearest = name;
        }
      }
      return nearest;
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = nearestHandle(pointerPosition(event));
      if (!dragging) return;
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = pointerPosition(event);
      if (!dragging) {
        canvas.style.cursor = nearestHandle(point) ? "grab" : "";
        return;
      }
      if (dragging === "start") path.start.set(point);
      else if (dragging === "end") path.end.set(point);
      else if (dragging === "vehicle") {
        const offset = Vector2D.sub(future, vehicle);
        vehicle.set(point);
        future.set(vehicle).add(offset);
      } else {
        const offset = Vector2D.sub(point, vehicle);
        if (offset.magnitude() > 0) {
          future
            .set(offset.normalize().multiply(NORMAL_LOOKAHEAD))
            .add(vehicle);
        }
      }
      canvas.style.cursor = "grabbing";
      draw();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = null;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    resetRef.current = () => {
      placeDefault();
      draw();
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
      if (first) placeDefault();
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
          Normal point
        </CVSubHeading>
        <PointerEventHandler asChild type="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Reset normal point sketch"
            onClick={() => resetRef.current()}
          >
            <RotateCcw />
          </Button>
        </PointerEventHandler>
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="A path with a vehicle and its future position. A dashed line drops from the future position to the path at a right angle, meeting it at the normal point. Drag the path ends, the vehicle, or the future position"
          className="h-full w-full touch-none"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const PATH_FOLLOW_RADIUS = 20;
/** How far ahead of the vehicle the future position is, in pixels. */
const PATH_FOLLOW_LOOKAHEAD = 25;
const PATH_FOLLOW_MAX_VEHICLES = 20;
/** Canvas pixels per world unit; below 1 zooms the sketch out. */
const PATH_FOLLOW_SCALE = 0.6;

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

/** Matches the Vehicle.follow in the path following post. */
export class PathFollowingVehicleBody extends VehicleBody {
  futurePosition = new Vector2D(0, 0);
  normal = new Vector2D(0, 0);
  target = new Vector2D(0, 0);
  steering = false;

  /** The point the vehicle steers towards when it is off the path. */
  pathTarget(_path: PathBody) {
    return this.normal.copy();
  }

  lookAhead(path: PathBody) {
    // 1. Take the future position of the agent
    const vel = this.velocity.copy();
    vel.normalize();
    vel.multiply(PATH_FOLLOW_LOOKAHEAD);
    this.futurePosition = Vector2D.add(this.position, vel);

    // Normal point: ||A|| cos θ along the path from its start
    const a = Vector2D.sub(this.futurePosition, path.start);
    const b = Vector2D.sub(path.end, path.start);
    const d = a.magnitude() * Math.cos(a.angleBetween(b));
    this.normal = Vector2D.add(path.start, b.copy().normalize().multiply(d));
    this.target = this.pathTarget(path);
  }

  follow(path: PathBody, radius: number) {
    this.lookAhead(path);

    const distance = Vector2D.sub(this.futurePosition, this.normal).magnitude();
    // 3. If the future position is far from the path, steer towards the path
    this.steering = distance > radius;
    if (this.steering) {
      const desired = Vector2D.sub(this.target, this.position);
      desired.normalize();
      desired.multiply(this.speed);

      const steer = Vector2D.sub(desired, this.velocity);
      steer.limit(this.maxForce);

      this.applyForce(steer);
    }
    // 2. If the future position is not far from the path, don't exert any force
  }
}

/** How far past the normal point, along the path, the along-path target sits. */
const PATH_FOLLOW_AHEAD = 25;

/** Steers to a point a little ahead of the normal point, along the path. */
export class AlongPathVehicleBody extends PathFollowingVehicleBody {
  pathTarget(path: PathBody) {
    const b = Vector2D.sub(path.end, path.start);
    const direction = b.copy().normalize();
    // Ahead means the way the vehicle is already travelling along the path
    if (Math.cos(this.velocity.angleBetween(b)) < 0) direction.multiply(-1);
    return Vector2D.add(this.normal, direction.multiply(PATH_FOLLOW_AHEAD));
  }
}

/** Vehicles following a straight path; click to add vehicles. */
export function PathFollowing({ className }: { className?: string }) {
  return <PathFollowingSketch className={className} along={false} />;
}

/** Like PathFollowing, but steering to a point ahead of the normal point. */
export function AlongPath({ className }: { className?: string }) {
  return <PathFollowingSketch className={className} along />;
}

function PathFollowingSketch({
  className,
  along,
}: {
  className?: string;
  along: boolean;
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
    const path = new PathBody(new Vector2D(0, 0), new Vector2D(0, 0));
    let vehicles: PathFollowingVehicleBody[] = [];

    const spawn = (x: number, y: number) => {
      const vehicle = along
        ? new AlongPathVehicleBody(x, y)
        : new PathFollowingVehicleBody(x, y);
      const angle = Math.random() * Math.PI * 2;
      vehicle.velocity.set(
        Math.cos(angle) * vehicle.speed,
        Math.sin(angle) * vehicle.speed,
      );
      vehicle.follow(path, PATH_FOLLOW_RADIUS);
      vehicle.acceleration.set(0, 0);
      vehicles.push(vehicle);
      if (vehicles.length > PATH_FOLLOW_MAX_VEHICLES) vehicles.shift();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      // Simulation runs in world units, drawn zoomed out
      const hairline = 1 / PATH_FOLLOW_SCALE;
      ctx.setTransform(
        dpr * PATH_FOLLOW_SCALE,
        0,
        0,
        dpr * PATH_FOLLOW_SCALE,
        0,
        0,
      );

      // The path, with its radius
      ctx.lineCap = "round";
      ctx.strokeStyle = muted;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = PATH_FOLLOW_RADIUS * 2;
      path.draw(ctx, muted);
      ctx.globalAlpha = 1;
      ctx.lineWidth = hairline;
      path.draw(ctx, color);
      ctx.lineCap = "butt";

      for (const vehicle of vehicles) {
        const { futurePosition, normal, steering } = vehicle;
        ctx.strokeStyle = steering ? primary : muted;
        ctx.setLineDash([3 * hairline, 3 * hairline]);
        ctx.beginPath();
        ctx.moveTo(vehicle.position.x, vehicle.position.y);
        ctx.lineTo(futurePosition.x, futurePosition.y);
        ctx.lineTo(normal.x, normal.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = steering ? primary : muted;
        ctx.beginPath();
        ctx.arc(futurePosition.x, futurePosition.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(normal.x, normal.y, 3, 0, Math.PI * 2);
        ctx.fill();

        if (along) {
          const { target } = vehicle;
          ctx.strokeStyle = steering ? primary : muted;
          ctx.lineWidth = hairline;
          ctx.beginPath();
          ctx.moveTo(normal.x, normal.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(target.x, target.y, 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        vehicle.show(ctx, color);
      }
      ctx.lineWidth = 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const steeringCount = vehicles.filter((v) => v.steering).length;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = muted;
      ctx.fillText(
        `radius = ${PATH_FOLLOW_RADIUS}, lookahead = ${PATH_FOLLOW_LOOKAHEAD}${
          along ? `, ahead = ${PATH_FOLLOW_AHEAD}` : ""
        }`,
        12,
        12,
      );
      ctx.fillStyle = steeringCount > 0 ? color : muted;
      ctx.fillText(
        `${steeringCount} of ${vehicles.length} steering back to the path`,
        12,
        28,
      );
      ctx.fillStyle = muted;
      ctx.textBaseline = "bottom";
      ctx.fillText("click to add a vehicle", 12, height - 10);
    };

    const update = () => {
      for (const vehicle of vehicles) {
        vehicle.follow(path, PATH_FOLLOW_RADIUS);
        vehicle.update();
        if (
          vehicle.edges(width / PATH_FOLLOW_SCALE, height / PATH_FOLLOW_SCALE)
        ) {
          vehicle.lookAhead(path);
        }
      }
    };

    const placePath = () => {
      const worldWidth = width / PATH_FOLLOW_SCALE;
      const worldHeight = height / PATH_FOLLOW_SCALE;
      path.start.set(0, worldHeight * 0.3);
      path.end.set(worldWidth, worldHeight * 0.7);
    };

    const reset = () => {
      placePath();
      vehicles = [];
      spawn(
        (width * 0.15) / PATH_FOLLOW_SCALE,
        (height * 0.75) / PATH_FOLLOW_SCALE,
      );
      draw();
    };

    resetRef.current = reset;

    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      spawn(
        (event.clientX - rect.left) / PATH_FOLLOW_SCALE,
        (event.clientY - rect.top) / PATH_FOLLOW_SCALE,
      );
      draw();
    };

    canvas.addEventListener("pointerdown", onPointerDown);

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
        placePath();
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
      canvas.removeEventListener("pointerdown", onPointerDown);
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, [along]);

  const title = along ? "Along the path" : "Path following";

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
              aria-label={`${playing ? "Stop" : "Play"} ${title.toLowerCase()} sketch`}
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
              aria-label={`Reset ${title.toLowerCase()} sketch`}
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
          aria-label={`Vehicles following a straight path. Each vehicle looks at its future position; when that is outside the path's radius it steers towards ${along ? "a point a little ahead of the normal point, along the path" : "the normal point on the path"}. Click to add a vehicle`}
          className="h-full w-full cursor-crosshair"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

/** Joints of the default multi-segment path, as fractions of the canvas size. */
const MULTIPLE_SEGMENTS_DEFAULT_POINTS = [
  new Vector2D(0.06, 0.62),
  new Vector2D(0.3, 0.3),
  new Vector2D(0.52, 0.7),
  new Vector2D(0.76, 0.32),
  new Vector2D(0.94, 0.58),
];

/** Matches the MultipleSegments in the path following post: paths joined end to start. */
export class MultipleSegmentsBody {
  paths: PathBody[] = [];

  addPath(path: PathBody) {
    this.paths.push(path);
  }

  draw(ctx: CanvasRenderingContext2D, stroke: string) {
    for (const path of this.paths) path.draw(ctx, stroke);
  }
}

/** A path made of connected segments; drag a joint to reshape it. */
export function MultipleSegments({ className }: { className?: string }) {
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
    let muted = "#9a9a9a";
    // Neighbouring paths share a joint, so dragging it moves both
    const joints = MULTIPLE_SEGMENTS_DEFAULT_POINTS.map(() => new Vector2D());
    const segments = new MultipleSegmentsBody();
    for (let i = 0; i < joints.length - 1; i++) {
      segments.addPath(new PathBody(joints[i], joints[i + 1]));
    }
    let dragging: Vector2D | null = null;

    const placeDefault = () => {
      MULTIPLE_SEGMENTS_DEFAULT_POINTS.forEach((point, i) => {
        joints[i].set(point.x * width, point.y * height);
      });
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      ctx.lineWidth = 2;
      segments.draw(ctx, color);
      ctx.lineWidth = 1;

      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      const background =
        getComputedStyle(canvas).getPropertyValue("--background").trim() ||
        "#ffffff";
      segments.paths.forEach((path, i) => {
        const mid = Vector2D.add(path.start, path.end).multiply(0.5);
        const text = `paths[${i}]`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = background;
        ctx.fillRect(mid.x - textWidth / 2 - 4, mid.y - 9, textWidth + 8, 18);
        ctx.fillStyle = muted;
        ctx.fillText(text, mid.x, mid.y);
      });

      ctx.fillStyle = color;
      for (const joint of joints) {
        ctx.beginPath();
        ctx.arc(joint.x, joint.y, PATH_HANDLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = muted;
      ctx.fillText(
        `${segments.paths.length} paths, each end is the next one's start`,
        12,
        height - 10,
      );
    };

    const pointerPosition = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return new Vector2D(
        Math.min(width, Math.max(0, event.clientX - rect.left)),
        Math.min(height, Math.max(0, event.clientY - rect.top)),
      );
    };

    const nearestJoint = (point: Vector2D) => {
      let nearest: Vector2D | null = null;
      let best = PATH_GRAB_RADIUS;
      for (const joint of joints) {
        const d = Vector2D.sub(point, joint).magnitude();
        if (d <= best) {
          best = d;
          nearest = joint;
        }
      }
      return nearest;
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = nearestJoint(pointerPosition(event));
      if (!dragging) return;
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = pointerPosition(event);
      if (!dragging) {
        canvas.style.cursor = nearestJoint(point) ? "grab" : "";
        return;
      }
      dragging.set(point);
      canvas.style.cursor = "grabbing";
      draw();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = null;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    resetRef.current = () => {
      placeDefault();
      draw();
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      const first = width === 0 || height === 0;
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      if (first) placeDefault();
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
          Multiple segments
        </CVSubHeading>
        <PointerEventHandler asChild type="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Reset multiple segments sketch"
            onClick={() => resetRef.current()}
          >
            <RotateCcw />
          </Button>
        </PointerEventHandler>
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="A path made of four straight segments joined end to start, each labelled paths[0] to paths[3]. Drag a joint to reshape the path"
          className="h-full w-full touch-none"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

/**
 * Matches Vehicle.follow(paths, radius) in the path following post:
 * pick the closest on-segment normal, then steer to a point ahead along that path.
 */
export class MultipleSegmentsFollowingVehicleBody extends VehicleBody {
  futurePosition = new Vector2D(0, 0);
  normal = new Vector2D(0, 0);
  target = new Vector2D(0, 0);
  steering = false;
  /** Index of the path currently being followed, or -1 when none is valid. */
  pathIndex = -1;

  lookAhead(paths: PathBody[]) {
    const vel = this.velocity.copy();
    vel.normalize();
    vel.multiply(PATH_FOLLOW_LOOKAHEAD);
    this.futurePosition = Vector2D.add(this.position, vel);

    let closestNormal: Vector2D | null = null;
    let closestPath: PathBody | null = null;
    let closestDistance = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      // 1. Does the normal lie within the path's start and end?
      let normalPoint = path.normalPoint(this.futurePosition);

      const a = Vector2D.sub(normalPoint, path.start);
      const b = Vector2D.sub(path.end, path.start);
      const pathLength = b.magnitude();
      if (pathLength === 0) continue;
      const along = a.dot(b.copy().normalize());

      // If not, clamp it onto the segment (Nature of Code: fall back to an endpoint)
      if (along < 0) {
        normalPoint = path.start.copy();
      } else if (along > pathLength) {
        normalPoint = path.end.copy();
      }

      // 2. Which normal is closest to the future position?
      const distance = Vector2D.sub(
        this.futurePosition,
        normalPoint,
      ).magnitude();
      if (distance < closestDistance) {
        closestDistance = distance;
        closestNormal = normalPoint;
        closestPath = path;
        closestIndex = i;
      }
    }

    this.pathIndex = closestIndex;
    if (closestNormal && closestPath) {
      this.normal.set(closestNormal);
      const direction = closestPath.direction();
      if (this.velocity.dot(direction) < 0) direction.multiply(-1);
      this.target.set(
        Vector2D.add(closestNormal, direction.multiply(PATH_FOLLOW_AHEAD)),
      );
    }
    return closestDistance;
  }

  follow(paths: PathBody[], radius: number) {
    const distance = this.lookAhead(paths);
    this.steering = this.pathIndex >= 0 && distance > radius;
    if (!this.steering) return;

    const desired = Vector2D.sub(this.target, this.position);
    desired.normalize();
    desired.multiply(this.speed);

    const steer = Vector2D.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    this.applyForce(steer);
  }
}

/** Vehicles following a multi-segment path; click to add vehicles. */
export function MultipleSegmentsFollowing({
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

    const joints = MULTIPLE_SEGMENTS_DEFAULT_POINTS.map(() => new Vector2D());
    const segments = new MultipleSegmentsBody();
    for (let i = 0; i < joints.length - 1; i++) {
      segments.addPath(new PathBody(joints[i], joints[i + 1]));
    }
    let vehicles: MultipleSegmentsFollowingVehicleBody[] = [];

    const placePath = () => {
      const worldWidth = width / PATH_FOLLOW_SCALE;
      const worldHeight = height / PATH_FOLLOW_SCALE;
      MULTIPLE_SEGMENTS_DEFAULT_POINTS.forEach((point, i) => {
        joints[i].set(point.x * worldWidth, point.y * worldHeight);
      });
    };

    const spawn = (x: number, y: number) => {
      const vehicle = new MultipleSegmentsFollowingVehicleBody(x, y);
      const angle = Math.random() * Math.PI * 2;
      vehicle.velocity.set(
        Math.cos(angle) * vehicle.speed,
        Math.sin(angle) * vehicle.speed,
      );
      vehicle.follow(segments.paths, PATH_FOLLOW_RADIUS);
      vehicle.acceleration.set(0, 0);
      vehicles.push(vehicle);
      if (vehicles.length > PATH_FOLLOW_MAX_VEHICLES) vehicles.shift();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const hairline = 1 / PATH_FOLLOW_SCALE;
      ctx.setTransform(
        dpr * PATH_FOLLOW_SCALE,
        0,
        0,
        dpr * PATH_FOLLOW_SCALE,
        0,
        0,
      );

      ctx.lineCap = "round";
      ctx.strokeStyle = muted;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = PATH_FOLLOW_RADIUS * 2;
      segments.draw(ctx, muted);
      ctx.globalAlpha = 1;
      ctx.lineWidth = hairline;
      segments.draw(ctx, color);
      ctx.lineCap = "butt";

      for (const joint of joints) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          joint.x,
          joint.y,
          PATH_HANDLE_RADIUS * hairline,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      for (const vehicle of vehicles) {
        const { futurePosition, normal, target, steering, pathIndex } = vehicle;
        if (pathIndex >= 0) {
          ctx.strokeStyle = steering ? primary : muted;
          ctx.setLineDash([3 * hairline, 3 * hairline]);
          ctx.beginPath();
          ctx.moveTo(vehicle.position.x, vehicle.position.y);
          ctx.lineTo(futurePosition.x, futurePosition.y);
          ctx.lineTo(normal.x, normal.y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = steering ? primary : muted;
          ctx.beginPath();
          ctx.arc(futurePosition.x, futurePosition.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(normal.x, normal.y, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.lineWidth = hairline;
          ctx.beginPath();
          ctx.moveTo(normal.x, normal.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(target.x, target.y, 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        vehicle.show(ctx, color);
      }
      ctx.lineWidth = 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const steeringCount = vehicles.filter((v) => v.steering).length;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = muted;
      ctx.fillText(
        `radius = ${PATH_FOLLOW_RADIUS}, lookahead = ${PATH_FOLLOW_LOOKAHEAD}, ahead = ${PATH_FOLLOW_AHEAD}`,
        12,
        12,
      );
      ctx.fillStyle = steeringCount > 0 ? color : muted;
      ctx.fillText(
        `${steeringCount} of ${vehicles.length} steering back to a segment`,
        12,
        28,
      );
      ctx.fillStyle = muted;
      ctx.textBaseline = "bottom";
      ctx.fillText("click to add a vehicle", 12, height - 10);
    };

    const update = () => {
      for (const vehicle of vehicles) {
        vehicle.follow(segments.paths, PATH_FOLLOW_RADIUS);
        vehicle.update();
        if (
          vehicle.edges(width / PATH_FOLLOW_SCALE, height / PATH_FOLLOW_SCALE)
        ) {
          vehicle.lookAhead(segments.paths);
        }
      }
    };

    const reset = () => {
      placePath();
      vehicles = [];
      spawn(
        (width * 0.15) / PATH_FOLLOW_SCALE,
        (height * 0.75) / PATH_FOLLOW_SCALE,
      );
      draw();
    };

    resetRef.current = reset;

    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      spawn(
        (event.clientX - rect.left) / PATH_FOLLOW_SCALE,
        (event.clientY - rect.top) / PATH_FOLLOW_SCALE,
      );
      draw();
    };

    canvas.addEventListener("pointerdown", onPointerDown);

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
        placePath();
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
      canvas.removeEventListener("pointerdown", onPointerDown);
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
          Multiple segments following
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={`${playing ? "Stop" : "Play"} multiple segments following sketch`}
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
              aria-label="Reset multiple segments following sketch"
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
          aria-label="Vehicles following a multi-segment path. Each vehicle picks the closest on-segment normal point, then steers to a target a little ahead along that segment. Click to add a vehicle"
          className="h-full w-full cursor-crosshair"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}
