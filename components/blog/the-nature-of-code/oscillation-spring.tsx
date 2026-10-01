"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Ball, Vector2D } from "@/components/blog/the-nature-of-code/vectors";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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

type OscillatorParams = { mass: number; stiffness: number; damping: number };

const OSCILLATOR_DEFAULTS: OscillatorParams = {
  mass: 1,
  stiffness: 100,
  damping: 4,
};
const OSCILLATOR_DURATION = 4;

/** x(t) for m·x'' + c·x' + k·x = 0, starting at x = 1 with no velocity. */
function dampedOscillator(
  t: number,
  { mass, stiffness, damping }: OscillatorParams,
) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return (
      Math.exp(-zeta * w0 * t) *
      (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
    );
  }
  if (zeta === 1) {
    return (1 + w0 * t) * Math.exp(-w0 * t);
  }
  const root = Math.sqrt(zeta * zeta - 1);
  const r1 = -w0 * (zeta - root);
  const r2 = -w0 * (zeta + root);
  return (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

/** Plots the exact solution of the damped harmonic oscillator for the chosen m, k and c. */
export function DampedOscillatorGraph({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(() => {});
  const paramsRef = useRef(OSCILLATOR_DEFAULTS);
  const [params, setParams] = useState(OSCILLATOR_DEFAULTS);

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

      const { mass, stiffness, damping } = paramsRef.current;
      const w0 = Math.sqrt(stiffness / mass);
      const zeta = damping / (2 * Math.sqrt(stiffness * mass));

      const left = 12;
      const right = width - 12;
      const midY = height * 0.5;
      const amp = height * 0.38;
      const toX = (t: number) =>
        left + (t / OSCILLATOR_DURATION) * (right - left);
      const toY = (x: number) => midY - x * amp;

      // Rest line and time ticks
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, midY);
      ctx.lineTo(right, midY);
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let s = 1; s <= OSCILLATOR_DURATION; s++) {
        const x = toX(s);
        ctx.beginPath();
        ctx.moveTo(x, midY - 4);
        ctx.lineTo(x, midY + 4);
        ctx.stroke();
        ctx.fillText(`${s}s`, x, midY + 8);
      }

      // Decay envelope ±e^(-ζω₀t) / √(1 - ζ²)
      if (zeta < 1) {
        const scale = 1 / Math.sqrt(1 - zeta * zeta);
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (const sign of [1, -1]) {
          ctx.beginPath();
          for (let px = left; px <= right; px++) {
            const t = ((px - left) / (right - left)) * OSCILLATOR_DURATION;
            const y = toY(sign * scale * Math.exp(-zeta * w0 * t));
            if (px === left) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // x(t)
      ctx.strokeStyle = primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = left; px <= right; px++) {
        const t = ((px - left) / (right - left)) * OSCILLATOR_DURATION;
        const y = toY(dampedOscillator(t, paramsRef.current));
        if (px === left) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      const regime =
        zeta < 1
          ? "underdamped"
          : zeta === 1
            ? "critically damped"
            : "overdamped";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(`ζ = ${zeta.toFixed(2)}  ·  ${regime}`, right, 10);
      ctx.fillStyle = muted;
      ctx.fillText(`ω₀ = ${w0.toFixed(2)} rad/s`, right, 26);
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

  useEffect(() => {
    paramsRef.current = params;
    drawRef.current();
  }, [params]);

  const sliders: {
    key: keyof OscillatorParams;
    min: number;
    max: number;
    step: number;
  }[] = [
    { key: "mass", min: 0.5, max: 5, step: 0.1 },
    { key: "stiffness", min: 10, max: 300, step: 1 },
    { key: "damping", min: 0, max: 40, step: 0.5 },
  ];

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Damped harmonic oscillator
        </CVSubHeading>
        <PointerEventHandler asChild type="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Reset oscillator graph"
            onClick={() => setParams(OSCILLATOR_DEFAULTS)}
          >
            <RotateCcw />
          </Button>
        </PointerEventHandler>
      </div>
      <div className="flex flex-col gap-2 border-b border-border px-3 py-2 font-mono text-xs text-muted-foreground">
        {sliders.map(({ key, min, max, step }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-20">{key}</span>
            <Slider
              className="flex-1"
              min={min}
              max={max}
              step={step}
              value={[params[key]]}
              aria-label={key}
              onValueChange={([value]) =>
                setParams((current) => ({ ...current, [key]: value }))
              }
            />
            <span className="w-12 text-right text-foreground">
              {params[key]}
            </span>
          </div>
        ))}
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="Graph of a damped harmonic oscillator's position over four seconds"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const SPRING_EASING_DEFAULTS: OscillatorParams = {
  mass: 1,
  stiffness: 100,
  damping: 10,
};
const SPRING_REST_DELTA = 0.001;
const SPRING_MAX_DURATION = 10;
const SPRING_EASING_HOLD = 0.8;
const SPRING_CSS_SAMPLES = 30;

/** Seconds until the spring stays within SPRING_REST_DELTA of its target. */
function springSettleTime(params: OscillatorParams) {
  const dt = 1 / 60;
  let last = 0;
  for (let t = 0; t <= SPRING_MAX_DURATION; t += dt) {
    if (Math.abs(dampedOscillator(t, params)) > SPRING_REST_DELTA) last = t;
  }
  return last + dt;
}

/** Progress 0 → 1 at normalized time p (0 → 1). */
function springEasing(p: number, params: OscillatorParams, settle: number) {
  return 1 - dampedOscillator(p * settle, params);
}

function springCssLinear(params: OscillatorParams, settle: number) {
  const points = Array.from({ length: SPRING_CSS_SAMPLES + 1 }, (_, i) =>
    Number(springEasing(i / SPRING_CSS_SAMPLES, params, settle).toFixed(3)),
  );
  points[0] = 0;
  points[SPRING_CSS_SAMPLES] = 1;
  return `linear(${points.join(", ")})`;
}

/** The oscillator flipped into an easing: progress = 1 - x(t), on normalized time. */
export function SpringEasingGraph({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef(SPRING_EASING_DEFAULTS);
  const settleRef = useRef(springSettleTime(SPRING_EASING_DEFAULTS));
  const [params, setParams] = useState(SPRING_EASING_DEFAULTS);
  const settle = useMemo(() => springSettleTime(params), [params]);
  const css = useMemo(() => springCssLinear(params, settle), [params, settle]);

  useEffect(() => {
    paramsRef.current = params;
    settleRef.current = settle;
  }, [params, settle]);

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
    let clock = 0;
    let lastTime = 0;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const params = paramsRef.current;
      const settle = settleRef.current;
      const zeta =
        params.damping / (2 * Math.sqrt(params.stiffness * params.mass));

      const left = 28;
      const right = width - 16;
      const top = 44;
      const bottom = height - 76;
      const steps = Math.max(1, Math.round(right - left));

      let minP = 0;
      let maxP = 1;
      for (let i = 0; i <= steps; i++) {
        const v = springEasing(i / steps, params, settle);
        minP = Math.min(minP, v);
        maxP = Math.max(maxP, v);
      }
      const yMin = minP - 0.05;
      const yMax = maxP + 0.05;
      const toX = (p: number) => left + p * (right - left);
      const toY = (v: number) =>
        bottom - ((v - yMin) / (yMax - yMin)) * (bottom - top);

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";

      // 0 and 1 guides
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (const v of [0, 1]) {
        ctx.moveTo(left, toY(v));
        ctx.lineTo(right, toY(v));
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = muted;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("0", left - 8, toY(0));
      ctx.fillText("1", left - 8, toY(1));

      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText("t = 0", left, bottom + 8);
      ctx.textAlign = "right";
      ctx.fillText(`t = 1  (${settle.toFixed(2)}s)`, right, bottom + 8);

      // Easing curve
      ctx.strokeStyle = primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const y = toY(springEasing(p, params, settle));
        if (i === 0) ctx.moveTo(toX(p), y);
        else ctx.lineTo(toX(p), y);
      }
      ctx.stroke();

      // Playback position
      const phase = clock % (settle + SPRING_EASING_HOLD);
      const p = Math.min(phase / settle, 1);
      const value = springEasing(p, params, settle);
      ctx.beginPath();
      ctx.arc(toX(p), toY(value), 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Track preview: "to" sits where the largest overshoot still fits
      const trackY = height - 26;
      const trackEnd = left + (right - left) / maxP;
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, trackY);
      ctx.lineTo(right, trackY);
      for (const x of [left, trackEnd]) {
        ctx.moveTo(x, trackY - 8);
        ctx.lineTo(x, trackY + 8);
      }
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "center";
      ctx.fillText("from", left, trackY - 10);
      ctx.fillText("to", trackEnd, trackY - 10);
      const boxX = left + value * (trackEnd - left);
      ctx.fillStyle = primary;
      ctx.fillRect(boxX - 7, trackY - 7, 14, 14);

      const regime =
        zeta < 1 ? "underdamped" : zeta === 1 ? "critical" : "overdamped";
      ctx.fillStyle = color;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(`ζ = ${zeta.toFixed(2)}  ·  ${regime}`, right, 10);
      ctx.fillStyle = muted;
      ctx.fillText(`progress = ${value.toFixed(2)}`, right, 26);
    };

    const tick = (time: number) => {
      raf = 0;
      if (!running || !visible) return;
      if (lastTime) clock += Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      draw();
      raf = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!running || !visible || raf) return;
      lastTime = 0;
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
    };
  }, []);

  const sliders: {
    key: keyof OscillatorParams;
    min: number;
    max: number;
    step: number;
  }[] = [
    { key: "mass", min: 0.5, max: 5, step: 0.1 },
    { key: "stiffness", min: 10, max: 300, step: 1 },
    { key: "damping", min: 1, max: 40, step: 0.5 },
  ];

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Spring easing
        </CVSubHeading>
        <PointerEventHandler asChild type="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Reset spring easing graph"
            onClick={() => setParams(SPRING_EASING_DEFAULTS)}
          >
            <RotateCcw />
          </Button>
        </PointerEventHandler>
      </div>
      <div className="flex flex-col gap-2 border-b border-border px-3 py-2 font-mono text-xs text-muted-foreground">
        {sliders.map(({ key, min, max, step }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-20">{key}</span>
            <Slider
              className="flex-1"
              min={min}
              max={max}
              step={step}
              value={[params[key]]}
              aria-label={key}
              onValueChange={([value]) =>
                setParams((current) => ({ ...current, [key]: value }))
              }
            />
            <span className="w-12 text-right text-foreground">
              {params[key]}
            </span>
          </div>
        ))}
      </div>
      <div className="relative aspect-4/3 w-full">
        <canvas
          ref={canvasRef}
          aria-label="A spring easing curve rising from 0 to 1 with overshoot, and a box animating with that easing"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
      <div className="border-t border-border px-3 py-2 font-mono text-[11px] break-all text-muted-foreground">
        <span className="text-foreground">transition-timing-function:</span>{" "}
        {`${css};`}
      </div>
    </div>
  );
}
