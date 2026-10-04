"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Ball, Vector2D } from "@/components/blog/the-nature-of-code/vectors";
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

const SPRING_K = 0.01;
const SPRING_GRAVITY = 0.1;
const SPRING_MASS = 1;
const SPRING_BALL_RADIUS = 10;

class Spring {
  anchor: Vector2D;
  restLength: number;
  k: number;
  connected: Ball | null = null;

  constructor(anchor: Vector2D, restLength: number, k = 0.01) {
    this.anchor = anchor;
    this.restLength = restLength;
    this.k = k;
  }

  connect(connected: Ball) {
    this.connected = connected;
  }

  update() {
    if (!this.connected) return;
    const dir = this.connected.position.copy().subtract(this.anchor);
    const distance = dir.copy().magnitude();

    const xMag = distance - this.restLength;
    const normalizedDir = dir.copy().normalize();

    const force = normalizedDir.multiply(-this.k * xMag);

    this.connected.applyForce(force);
  }

  draw(ctx: CanvasRenderingContext2D, stroke: string) {
    if (!this.connected) return;
    ctx.beginPath();
    ctx.moveTo(this.anchor.x, this.anchor.y);
    ctx.lineTo(this.connected.position.x, this.connected.position.y);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

const SPRING_DAMPING = 0.98;

/** A ball hanging from a spring: F = -k · x, plus gravity. Drag the ball to stretch it. */
export function SpringCanvas({ className }: { className?: string }) {
  return (
    <SpringSketch
      className={className}
      damping={1}
      startStretch={0}
      title="Spring · Hooke's law"
      name="spring"
    />
  );
}

/** Same spring, but velocity decays each frame (v *= 0.98) so the bounce settles. */
export function SpringDampCanvas({ className }: { className?: string }) {
  return (
    <SpringSketch
      className={className}
      damping={SPRING_DAMPING}
      startStretch={0.3}
      title="Spring · damping"
      name="damped spring"
    />
  );
}

function SpringSketch({
  className,
  damping,
  startStretch,
  title,
  name,
}: {
  className?: string;
  damping: number;
  /** Initial pull below the rest length, as a fraction of the canvas height. */
  startStretch: number;
  title: string;
  name: string;
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
    let dragging = false;

    const ball = new Ball(0, 0, SPRING_BALL_RADIUS, SPRING_MASS);
    const spring = new Spring(new Vector2D(0, 0), 0, SPRING_K);
    spring.connect(ball);
    const gravity = new Vector2D(0, SPRING_GRAVITY);

    const layout = () => {
      spring.anchor.set(width / 2, 0);
      spring.restLength = height / 2;
      ball.position.set(width / 2, height / 2 + height * startStretch);
      ball.velocity.set(0, 0);
      ball.acceleration.set(0, 0);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      spring.draw(ctx, color);
      ctx.beginPath();
      ctx.arc(spring.anchor.x, spring.anchor.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ball.draw(ctx, primary, color);

      const stretch =
        Vector2D.sub(ball.position, spring.anchor).magnitude() -
        spring.restLength;
      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`F = -k · x  ·  k = ${SPRING_K}`, 12, 12);
      ctx.fillText(`x = ${stretch.toFixed(1)}`, 12, 28);
      if (damping < 1) ctx.fillText(`v = v × ${damping}`, 12, 44);
      ctx.textBaseline = "bottom";
      ctx.fillText("drag the ball", 12, height - 10);
    };

    const update = () => {
      if (dragging) return;
      ball.applyForce(gravity);

      if (damping < 1) {
        ball.velocity.multiply(damping);
      }

      spring.update();
      ball.update();
    };

    const reset = () => {
      layout();
      draw();
    };

    resetRef.current = reset;

    const readPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ball.position.set(event.clientX - rect.left, event.clientY - rect.top);
      ball.velocity.set(0, 0);
      ball.acceleration.set(0, 0);
      draw();
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      readPointer(event);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging) readPointer(event);
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
        spring.anchor.set(width / 2, 0);
        spring.restLength = height / 2;
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
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, [damping, startStretch]);

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
              aria-label={`${playing ? "Stop" : "Play"} ${name} sketch`}
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
              aria-label={`Reset ${name} sketch`}
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
          aria-label={`A ball hanging from a ${name} anchored at the top, bouncing under gravity and the spring force`}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}
