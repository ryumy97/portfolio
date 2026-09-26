"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Ball, Vector2D } from "@/components/blog/the-nature-of-code/vectors";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { CVSubHeading } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";

const BALL_RADIUS = 12;
const MOTION_SPEED = 2.2;

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

function drawVelocityArrow(
  ctx: CanvasRenderingContext2D,
  position: Vector2D,
  velocity: Vector2D,
  color: string,
  scale = 14,
) {
  if (velocity.magnitude() <= 0.05) return;
  const tipX = position.x + velocity.x * scale;
  const tipY = position.y + velocity.y * scale;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(position.x, position.y);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  drawArrowHead(ctx, position.x, position.y, tipX, tipY, 7);
  return { tipX, tipY };
}

/** Newton's first law: rest stays rest, motion stays motion — until an external force. */
export function NewtonFirstLaw({ className }: { className?: string }) {
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

    const atRest = new Ball(0, 0, BALL_RADIUS);
    const inMotion = new Ball(0, 0, BALL_RADIUS);

    const layout = () => {
      atRest.position.set(width * 0.25, height * 0.5);
      atRest.velocity.set(0, 0);
      atRest.acceleration.set(0, 0);
      inMotion.position.set(width * 0.5, height * 0.5);
      inMotion.velocity.set(MOTION_SPEED, 0);
      inMotion.acceleration.set(0, 0);
    };

    const drawLabeledBall = (ball: Ball, label: string, sub: string) => {
      drawVelocityArrow(ctx, ball.position, ball.velocity, muted);
      ball.draw(ctx, primary, color);

      ctx.fillStyle = color;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(label, ball.position.x, ball.position.y + ball.radius + 10);
      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(sub, ball.position.x, ball.position.y + ball.radius + 26);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const mid = width * 0.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(mid, 16);
      ctx.lineTo(mid, height - 16);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("ΣF = 0", width * 0.25, 14);
      ctx.fillText("ΣF = 0", width * 0.75, 14);

      drawLabeledBall(atRest, "at rest", "v = 0");
      drawLabeledBall(
        inMotion,
        "in motion",
        `v = (${inMotion.velocity.x.toFixed(1)}, ${inMotion.velocity.y.toFixed(1)}) · constant`,
      );
    };

    const update = () => {
      // Constant velocity: position.add(velocity), acceleration stays zero.
      inMotion.acceleration.set(0, 0);
      inMotion.update();
      if (inMotion.position.x >= width - inMotion.radius) {
        inMotion.position.x = width * 0.5;
      }
    };

    const reset = () => {
      layout();
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
          Newton I · inertia
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={
                playing ? "Stop first law sketch" : "Play first law sketch"
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
              aria-label="Reset first law sketch"
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
          aria-label="Demonstration of Newton's first law with a resting ball and a ball in constant motion"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const FORCE_IMPULSE = 1.2;
const FORCE_ARROW_SCALE = 40;
const FORCE_FLASH_FRAMES = 45;

/** Click applies an external force; with m = 1, F = a and velocity changes. */
export function NewtonFirstLawForce({ className }: { className?: string }) {
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

    const ball = new Ball(0, 0, BALL_RADIUS);
    const force = new Vector2D(0, 0);
    let forceFlash = 0;

    const layout = () => {
      ball.position.set(width * 0.5, height * 0.5);
      ball.velocity.set(0, 0);
      ball.acceleration.set(0, 0);
      force.set(0, 0);
      forceFlash = 0;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("m = 1  →  F = a  ·  click the ball to push", 12, 12);
      ctx.fillText(
        `v = (${ball.velocity.x.toFixed(2)}, ${ball.velocity.y.toFixed(2)})`,
        12,
        28,
      );

      const velTip = drawVelocityArrow(
        ctx,
        ball.position,
        ball.velocity,
        muted,
      );
      if (velTip) {
        ctx.fillStyle = muted;
        ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText("velocity", velTip.tipX + 6, velTip.tipY - 4);
      }

      if (forceFlash > 0 && force.magnitude() > 0.001) {
        const tipX = ball.position.x + force.x * FORCE_ARROW_SCALE;
        const tipY = ball.position.y + force.y * FORCE_ARROW_SCALE;
        const alpha = Math.min(1, forceFlash / 12);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = primary;
        ctx.fillStyle = primary;
        ctx.lineWidth = 2.25;
        ctx.beginPath();
        ctx.moveTo(ball.position.x, ball.position.y);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        drawArrowHead(ctx, ball.position.x, ball.position.y, tipX, tipY, 10);
        ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(
          `F = a = (${force.x.toFixed(2)}, ${force.y.toFixed(2)})`,
          tipX + 8,
          tipY + 4,
        );
        ctx.globalAlpha = 1;
      }

      ball.draw(ctx, primary, color);
    };

    const update = () => {
      // After the impulse, ΣF = 0 — velocity stays constant (1st law).
      ball.acceleration.set(0, 0);
      ball.update();
      ball.bounce(width, height);
      if (forceFlash > 0) forceFlash -= 1;
    };

    const reset = () => {
      layout();
      draw();
    };

    resetRef.current = reset;

    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const click = new Vector2D(
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
      const dx = click.x - ball.position.x;
      const dy = click.y - ball.position.y;
      // Only react when the ball itself is clicked.
      if (dx * dx + dy * dy > ball.radius * ball.radius) return;

      // Poke: push away from the click point on the ball (m = 1 ⇒ a = F).
      force.set(-dx, -dy);
      if (force.magnitude() < 0.001) {
        force.set(FORCE_IMPULSE, 0);
      } else {
        force.normalize();
        force.multiply(FORCE_IMPULSE);
      }
      ball.velocity.add(force);
      forceFlash = FORCE_FLASH_FRAMES;
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
          Newton I · apply force (m = 1)
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={playing ? "Stop force sketch" : "Play force sketch"}
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
              aria-label="Reset force sketch"
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
            aria-label="Click the ball to apply a force impulse; with unit mass, force equals acceleration"
            className="h-full w-full cursor-pointer"
            style={CANVAS_STYLE}
          />
        </div>
      </PointerEventHandler>
    </div>
  );
}

const WIND_MASS_A = 1;
const WIND_MASS_B = 2;
const WIND_RADIUS_A = 12 * WIND_MASS_A;
const WIND_RADIUS_B = 12 * WIND_MASS_B;

/** Two balls fall under gravity; click (hold) to apply a constant wind force. */
export function SimpleWind({ className }: { className?: string }) {
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
    let windOn = false;

    const ballA = new Ball(0, 0, WIND_RADIUS_A, WIND_MASS_A);
    const ballB = new Ball(0, 0, WIND_RADIUS_B, WIND_MASS_B);
    const wind = new Vector2D(0.1, 0);
    const gravity = new Vector2D(0, 0);

    const layout = () => {
      // Bottom-align both balls near the top, then let them drop.
      const dropBottom = 8 + 2 * Math.max(ballA.radius, ballB.radius);
      ballA.position.set(width * 0.35, dropBottom - ballA.radius);
      ballA.velocity.set(0, 0);
      ballA.acceleration.set(0, 0);
      ballB.position.set(width * 0.65, dropBottom - ballB.radius);
      ballB.velocity.set(0, 0);
      ballB.acceleration.set(0, 0);
      windOn = false;
    };

    const drawLabeledBall = (ball: Ball, label: string) => {
      drawVelocityArrow(ctx, ball.position, ball.velocity, muted, 10);
      ball.draw(ctx, primary, color);

      ctx.fillStyle = color;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(label, ball.position.x, ball.position.y + ball.radius + 8);
      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(
        `m = ${ball.mass}`,
        ball.position.x,
        ball.position.y + ball.radius + 24,
      );
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        "gravity = (0, 0.1 · m)  ·  click for wind = (0.1, 0)",
        12,
        12,
      );
      ctx.fillText(windOn ? "wind ON  ·  a_wind = F / m" : "wind OFF", 12, 28);

      if (windOn) {
        const y = 48;
        ctx.strokeStyle = primary;
        ctx.fillStyle = primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, y);
        ctx.lineTo(52, y);
        ctx.stroke();
        drawArrowHead(ctx, 12, y, 52, y, 8);
        ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("F_wind", 58, y);
      }

      drawLabeledBall(ballA, "A");
      drawLabeledBall(ballB, "B");
    };

    const applyForces = (ball: Ball) => {
      // Gravity scales with mass → a = (0, 1) for every ball.
      gravity.set(0, 0.1 * ball.mass);
      ball.applyForce(gravity);
      // Wind is constant → lighter ball accelerates more (F = ma).
      if (windOn) ball.applyForce(wind);
    };

    const update = () => {
      ballA.acceleration.set(0, 0);
      ballB.acceleration.set(0, 0);
      applyForces(ballA);
      applyForces(ballB);
      ballA.update();
      ballB.update();
      ballA.bounce(width, height);
      ballB.bounce(width, height);
    };

    const reset = () => {
      layout();
      draw();
    };

    resetRef.current = reset;

    const onPointerDown = () => {
      windOn = true;
      draw();
    };
    const onPointerUp = () => {
      windOn = false;
      draw();
    };
    const onPointerCancel = () => {
      windOn = false;
      draw();
    };
    const onPointerLeave = () => {
      windOn = false;
      draw();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
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
        ballA.bounce(width, height);
        ballB.bounce(width, height);
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
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
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
          Newton II · wind + gravity
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={playing ? "Stop wind sketch" : "Play wind sketch"}
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
              aria-label="Reset wind sketch"
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
            aria-label="Two balls of different mass falling under gravity; click and hold to apply wind"
            className="h-full w-full cursor-crosshair"
            style={CANVAS_STYLE}
          />
        </div>
      </PointerEventHandler>
    </div>
  );
}

const DRAG_MASS_A = 1;
const DRAG_MASS_B = 2;
const DRAG_RADIUS_A = 12 * DRAG_MASS_A;
const DRAG_RADIUS_B = 12 * DRAG_MASS_B;
const DRAG_COEFFICIENT = 0.01;

/** Two balls fall under gravity + drag; click (hold) for wind. Bounce height decays. */
export function DragCanvas({ className }: { className?: string }) {
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
    let windOn = false;

    const ballA = new Ball(0, 0, DRAG_RADIUS_A, DRAG_MASS_A);
    const ballB = new Ball(0, 0, DRAG_RADIUS_B, DRAG_MASS_B);
    const wind = new Vector2D(0.1, 0);
    const gravity = new Vector2D(0, 0);
    const dragForce = new Vector2D(0, 0);

    const layout = () => {
      const dropBottom = 8 + 2 * Math.max(ballA.radius, ballB.radius);
      ballA.position.set(width * 0.35, dropBottom - ballA.radius);
      ballA.velocity.set(0, 0);
      ballA.acceleration.set(0, 0);
      ballB.position.set(width * 0.65, dropBottom - ballB.radius);
      ballB.velocity.set(0, 0);
      ballB.acceleration.set(0, 0);
      windOn = false;
    };

    const getDragAppliedForce = (ball: Ball) => {
      const speed = ball.velocity.magnitude();
      if (speed < 0.001) {
        dragForce.set(0, 0);
        return dragForce;
      }
      const dragMag = speed * speed * DRAG_COEFFICIENT;
      dragForce.set(ball.velocity);
      dragForce.multiply(-1).normalize().multiply(dragMag);
      return dragForce;
    };

    const drawLabeledBall = (ball: Ball, label: string) => {
      drawVelocityArrow(ctx, ball.position, ball.velocity, muted, 10);
      ball.draw(ctx, primary, color);

      ctx.fillStyle = color;
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(label, ball.position.x, ball.position.y + ball.radius + 8);
      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(
        `m = ${ball.mass}`,
        ball.position.x,
        ball.position.y + ball.radius + 24,
      );
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("drag = −v̂ · v² · 0.01  ·  gravity = (0, 0.1 · m)", 12, 12);
      ctx.fillText(
        windOn ? "wind ON  ·  click held" : "click for wind = (0.1, 0)",
        12,
        28,
      );

      drawLabeledBall(ballA, "A");
      drawLabeledBall(ballB, "B");
    };

    const applyForces = (ball: Ball) => {
      ball.applyForce(getDragAppliedForce(ball));
      gravity.set(0, 0.1 * ball.mass);
      ball.applyForce(gravity);
      if (windOn) ball.applyForce(wind);
    };

    const update = () => {
      ballA.acceleration.set(0, 0);
      ballB.acceleration.set(0, 0);
      applyForces(ballA);
      applyForces(ballB);
      ballA.update();
      ballB.update();
      // Elastic walls — drag still bleeds energy so bounce height decays.
      ballA.bounce(width, height);
      ballB.bounce(width, height);
    };

    const reset = () => {
      layout();
      draw();
    };

    resetRef.current = reset;

    const onPointerDown = () => {
      windOn = true;
      draw();
    };
    const onPointerUp = () => {
      windOn = false;
      draw();
    };
    const onPointerCancel = () => {
      windOn = false;
      draw();
    };
    const onPointerLeave = () => {
      windOn = false;
      draw();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
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
        ballA.bounce(width, height);
        ballB.bounce(width, height);
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
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
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
          Drag · air resistance
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={playing ? "Stop drag sketch" : "Play drag sketch"}
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
              aria-label="Reset drag sketch"
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
            aria-label="Two balls falling with gravity and drag; click and hold to apply wind"
            className="h-full w-full cursor-crosshair"
            style={CANVAS_STYLE}
          />
        </div>
      </PointerEventHandler>
    </div>
  );
}

const MASS_A = 1;
const MASS_B = 1;
const RADIUS_A = 12 * MASS_A;
const RADIUS_B = 12 * MASS_B;
const COLLIDE_SPEED = 3.2;
const FORCE_FLASH_MS = 50;

/** A (m=1) collides with B (m=1) — equal and opposite impulses. */
export function NewtonThirdLaw({ className }: { className?: string }) {
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

    const ballA = new Ball(0, 0, RADIUS_A, MASS_A);
    const ballB = new Ball(0, 0, RADIUS_B, MASS_B);
    let forceFlash = 0;
    let lastImpulse = 0;

    const layout = () => {
      ballA.position.set(width * 0.2, height * 0.5);
      ballB.position.set(width * 0.55, height * 0.5);
      ballA.velocity.set(COLLIDE_SPEED, 0);
      ballB.velocity.set(0, 0);
      ballA.acceleration.set(0, 0);
      ballB.acceleration.set(0, 0);
      forceFlash = 0;
      lastImpulse = 0;
    };

    const drawLabeledBall = (ball: Ball, label: string) => {
      drawVelocityArrow(ctx, ball.position, ball.velocity, muted, 12);
      ball.draw(ctx, primary, color);

      ctx.fillStyle = color;
      ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, ball.position.x, ball.position.y);

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "top";
      ctx.fillText(
        `m = ${ball.mass}`,
        ball.position.x,
        ball.position.y + ball.radius + 8,
      );
      ctx.fillText(
        `v = ${ball.velocity.x.toFixed(2)}`,
        ball.position.x,
        ball.position.y + ball.radius + 24,
      );
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("A hits B  ·  F_AB = −F_BA  ·  Δv = J / m", 12, 12);

      ctx.strokeStyle = muted;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, ballA.position.y + RADIUS_B + 4);
      ctx.lineTo(width - 16, ballB.position.y + RADIUS_B + 4);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (forceFlash > 0 && Math.abs(lastImpulse) > 0.001) {
        const midX = (ballA.position.x + ballB.position.x) / 2;
        const midY = ballA.position.y;
        const alpha = Math.min(1, forceFlash / 12);
        const arrowLen = Math.min(56, 28 + Math.abs(lastImpulse) * 8);

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = primary;
        ctx.fillStyle = primary;
        ctx.lineWidth = 2.25;
        ctx.beginPath();
        ctx.moveTo(midX, midY - 28);
        ctx.lineTo(midX + arrowLen, midY - 28);
        ctx.stroke();
        drawArrowHead(ctx, midX, midY - 28, midX + arrowLen, midY - 28, 9);
        ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText("F on B (= +J)", midX + arrowLen + 6, midY - 30);

        ctx.beginPath();
        ctx.moveTo(midX, midY + 28);
        ctx.lineTo(midX - arrowLen, midY + 28);
        ctx.stroke();
        drawArrowHead(ctx, midX, midY + 28, midX - arrowLen, midY + 28, 9);
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText("F on A (= −J)", midX - arrowLen - 6, midY + 30);

        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(
          `|J| = ${Math.abs(lastImpulse).toFixed(2)}`,
          midX,
          midY - 40,
        );
        ctx.globalAlpha = 1;
      }

      drawLabeledBall(ballA, "A");
      drawLabeledBall(ballB, "B");
    };

    const collide = () => {
      // Newton III + II: equal-and-opposite impulses, each applied as Δv = J / m.
      lastImpulse = ballA.collide(ballB, 1);
      if (lastImpulse !== 0) forceFlash = FORCE_FLASH_MS;
    };

    const update = () => {
      ballA.acceleration.set(0, 0);
      ballB.acceleration.set(0, 0);
      ballA.update();
      ballB.update();

      const touching =
        ballB.position.x - ballA.position.x <= ballA.radius + ballB.radius;
      const approaching = ballA.velocity.x > ballB.velocity.x;
      if (touching && approaching) {
        collide();
      }

      if (
        ballA.position.x > width + ballA.radius ||
        ballB.position.x > width + ballB.radius ||
        ballA.position.x < -ballA.radius * 2
      ) {
        layout();
      }

      if (forceFlash > 0) forceFlash -= 1;
    };

    const reset = () => {
      layout();
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
          Newton III · A (m=1) hits B (m=1)
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={
                playing ? "Stop third law sketch" : "Play third law sketch"
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
              aria-label="Reset third law sketch"
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
          aria-label="Demonstration of Newton's third law with equal masses colliding"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}
