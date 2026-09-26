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

/** Matches the Vector2D used throughout the vectors post. */
export class Vector2D {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x: number | Vector2D, y = 0) {
    if (typeof x === "object") {
      this.x = x.x;
      this.y = x.y;
      return this;
    }
    this.x = x;
    this.y = y;
    return this;
  }

  copy() {
    return new Vector2D(this.x, this.y);
  }

  add(vector: Vector2D) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  subtract(vector: Vector2D) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }

  multiply(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  divide(scalar: number) {
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  magnitude() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const m = this.magnitude();
    if (m === 0) return this;
    return this.divide(m);
  }

  limit(max: number) {
    const m = this.magnitude();
    if (m > max && m > 0) {
      this.normalize();
      this.multiply(max);
    }
    return this;
  }

  dot(vector: Vector2D) {
    return this.x * vector.x + this.y * vector.y;
  }

  static sub(a: Vector2D, b: Vector2D) {
    return new Vector2D(a.x - b.x, a.y - b.y);
  }
}

const POSITION_RADIUS = 10;

/** Ball with position / velocity / acceleration — same structure as the post. */
export class Ball {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  radius: number;
  mass: number;

  constructor(x: number, y: number, radius = POSITION_RADIUS, mass = 1) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.acceleration = new Vector2D(0, 0);
    this.radius = radius;
    this.mass = mass;
  }

  /** Newton's 2nd law: a = F / m */
  applyForce(force: Vector2D) {
    const f = force.copy();
    f.divide(this.mass);
    this.acceleration.add(f);
    return this;
  }

  /** Instantaneous impulse J — Δv = J / m (integrated F = ma over the collision). */
  applyImpulse(impulse: Vector2D) {
    const deltaV = impulse.copy();
    deltaV.divide(this.mass);
    this.velocity.add(deltaV);
    return this;
  }

  /** Point acceleration at (or away from) a target, matching the MDX snippets. */
  accelerateToward(target: Vector2D, strength: number) {
    const direction = Vector2D.sub(target, this.position);
    direction.normalize();
    direction.multiply(strength);
    this.acceleration.set(direction);
  }

  /**
   * Resolve a collision using Newton's 2nd & 3rd laws:
   * equal-and-opposite impulses J and −J, each changing velocity by J/m.
   */
  collide(other: Ball, restitution = 1) {
    const normal = Vector2D.sub(other.position, this.position);
    const distance = normal.magnitude();
    if (distance === 0) return 0;
    normal.normalize();

    const relativeVelocity = Vector2D.sub(other.velocity, this.velocity);
    const speedAlongNormal = relativeVelocity.dot(normal);
    // Already separating — no impulse.
    if (speedAlongNormal > 0) return 0;

    // Impulse scalar from conservation of momentum + restitution.
    const j =
      (-(1 + restitution) * speedAlongNormal) /
      (1 / this.mass + 1 / other.mass);

    // Newton III: forces (impulses) are equal and opposite.
    const impulseOnOther = normal.copy().multiply(j);
    const impulseOnThis = impulseOnOther.copy().multiply(-1);

    // Newton II: Δv = J / m
    this.applyImpulse(impulseOnThis);
    other.applyImpulse(impulseOnOther);

    // Separate overlapping circles so they don't stick.
    const overlap = this.radius + other.radius - distance;
    if (overlap > 0) {
      const correction = normal.copy().multiply(overlap / 2 + 0.5);
      this.position.subtract(correction);
      other.position.add(correction);
    }

    return j;
  }

  update(maxSpeed?: number) {
    this.velocity.add(this.acceleration);
    if (maxSpeed !== undefined) this.velocity.limit(maxSpeed);
    this.position.add(this.velocity);
  }

  bounce(width: number, height: number, restitution = 1) {
    const r = this.radius;
    if (this.position.x > width - r || this.position.x < r) {
      this.velocity.x *= -restitution;
      this.position.x = Math.min(Math.max(this.position.x, r), width - r);
    }
    if (this.position.y > height - r || this.position.y < r) {
      this.velocity.y *= -restitution;
      this.position.y = Math.min(Math.max(this.position.y, r), height - r);
    }
  }

  draw(ctx: CanvasRenderingContext2D, fill: string, stroke: string) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
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
    const ball = new Ball(POSITION_X, POSITION_Y);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const { x, y } = ball.position;

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(`x = ${x}`, x / 2 - 12, y - 6);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`y = ${y}`, x + 8, y / 2);

      ctx.strokeStyle = primary;
      ctx.fillStyle = primary;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
      drawArrowHead(ctx, 0, 0, x, y, 10);

      ball.draw(ctx, primary, color);

      ctx.fillStyle = primary;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`position = (${x}, ${y})`, x + ball.radius + 8, y + 4);

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
    const ball = new Ball(START_X, START_Y);
    ball.velocity.set(VELOCITY_X, VELOCITY_Y);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const { x, y } = ball.position;
      const tipX = x + ball.velocity.x * VELOCITY_ARROW_SCALE;
      const tipY = y + ball.velocity.y * VELOCITY_ARROW_SCALE;

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
      ctx.fillText(
        `velocity = (${ball.velocity.x}, ${ball.velocity.y})`,
        tipX + 6,
        tipY - 4,
      );

      ball.draw(ctx, primary, color);

      ctx.fillStyle = primary;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `position = (${Math.round(x)}, ${Math.round(y)})`,
        x + ball.radius + 8,
        y + 4,
      );
    };

    const update = () => {
      // position.add(velocity) — acceleration stays zero
      ball.acceleration.set(0, 0);
      ball.update();
      ball.bounce(width, height);
    };

    const reset = () => {
      ball.position.set(START_X, START_Y);
      ball.velocity.set(VELOCITY_X, VELOCITY_Y);
      ball.acceleration.set(0, 0);
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
      ball.bounce(width, height);
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
    const ball = new Ball(START_X, START_Y);
    ball.velocity.set(VELOCITY_X, VELOCITY_Y);
    const gravity = new Vector2D(ACCEL_X, ACCEL_Y);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const { x, y } = ball.position;
      const velTipX = x + ball.velocity.x * VELOCITY_ARROW_SCALE;
      const velTipY = y + ball.velocity.y * VELOCITY_ARROW_SCALE;
      const accTipX = x + gravity.x * ACCEL_ARROW_SCALE;
      const accTipY = y + gravity.y * ACCEL_ARROW_SCALE;

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
        `velocity = (${ball.velocity.x.toFixed(1)}, ${ball.velocity.y.toFixed(1)})`,
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
      ctx.fillText(
        `acceleration = (${gravity.x}, ${gravity.y})`,
        accTipX + 6,
        accTipY + 4,
      );

      ball.draw(ctx, primary, color);

      ctx.fillStyle = color;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `position = (${Math.round(x)}, ${Math.round(y)})`,
        x + ball.radius + 8,
        y + ball.radius + 4,
      );
    };

    const update = () => {
      ball.acceleration.set(gravity);
      ball.update();
      ball.bounce(width, height);
    };

    const reset = () => {
      ball.position.set(START_X, START_Y);
      ball.velocity.set(VELOCITY_X, VELOCITY_Y);
      ball.acceleration.set(0, 0);
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
      ball.bounce(width, height);
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
    const ball = new Ball(START_X, START_Y);
    const mouse = new Vector2D(START_X + 120, START_Y + 40);
    let hasPointer = false;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const { x, y } = ball.position;

      if (hasPointer) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = muted;
        ctx.fill();
      }

      const velTipX = x + ball.velocity.x * VELOCITY_ARROW_SCALE;
      const velTipY = y + ball.velocity.y * VELOCITY_ARROW_SCALE;
      const accTipX = x + ball.acceleration.x * INTERACTIVE_ACCEL_SCALE;
      const accTipY = y + ball.acceleration.y * INTERACTIVE_ACCEL_SCALE;

      if (ball.velocity.magnitude() > 0.05) {
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
          `velocity = (${ball.velocity.x.toFixed(1)}, ${ball.velocity.y.toFixed(1)})`,
          velTipX + 6,
          velTipY - 4,
        );
      }

      if (ball.acceleration.magnitude() > 0.001) {
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

      ball.draw(ctx, primary, color);

      ctx.fillStyle = color;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `position = (${Math.round(x)}, ${Math.round(y)})`,
        x + ball.radius + 8,
        y + ball.radius + 4,
      );
    };

    const update = () => {
      ball.accelerateToward(mouse, INTERACTIVE_ACCEL * sign);
      ball.update(INTERACTIVE_MAX_SPEED);
      ball.bounce(width, height, 0.9);
    };

    const reset = () => {
      ball.position.set(
        width > 0 ? width * 0.25 : START_X,
        height > 0 ? height * 0.35 : START_Y,
      );
      ball.velocity.set(0, 0);
      ball.acceleration.set(0, 0);
      mouse.set(
        width > 0 ? width * 0.7 : START_X + 120,
        height > 0 ? height * 0.55 : START_Y + 40,
      );
      draw();
    };

    resetRef.current = reset;

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.set(event.clientX - rect.left, event.clientY - rect.top);
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
        ball.bounce(width, height);
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
    const mouse = new Vector2D(0, 0);
    let hasPointer = false;
    let balls: Ball[] = [];

    const spawnBalls = () => {
      balls = Array.from({ length: MULTI_BALL_COUNT }, () => {
        const ball = new Ball(
          Math.random() * Math.max(width - POSITION_RADIUS * 2, 1) +
            POSITION_RADIUS,
          Math.random() * Math.max(height - POSITION_RADIUS * 2, 1) +
            POSITION_RADIUS,
        );
        return ball;
      });
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      if (hasPointer) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = muted;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }

      for (const ball of balls) {
        ball.draw(ctx, primary, color);
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
        ball.accelerateToward(mouse, -INTERACTIVE_ACCEL);
        ball.update(INTERACTIVE_MAX_SPEED);
        ball.bounce(width, height, 0.9);
      }
    };

    const reset = () => {
      spawnBalls();
      mouse.set(width * 0.5, height * 0.5);
      draw();
    };

    resetRef.current = reset;

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.set(event.clientX - rect.left, event.clientY - rect.top);
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
          ball.bounce(width, height);
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
