"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

type OscillatorParams = { mass: number; stiffness: number; damping: number };

const OSCILLATOR_DEFAULTS: OscillatorParams = {
  mass: 1,
  stiffness: 100,
  damping: 10,
};
const OSCILLATOR_DURATION = 4;

// Damped Harmonic Oscillator
// returns position x(t) and velocity v(t), starting at x0 with velocity v0
function dampedOscillator(
  t: number,
  {
    mass,
    stiffness,
    damping,
    x0 = 1,
    v0 = 0,
  }: OscillatorParams & { x0?: number; v0?: number },
) {
  const w0 = Math.sqrt(stiffness / mass); // ω0 = √(k / m)
  const gamma = damping / (2 * mass); // γ = c / 2m

  // γ < ω0 - underdamped: the root is imaginary, so it oscillates
  // x(t) = C e^(-γt) cos(ωd t + φ)
  // v(t) = -C e^(-γt) (γ cos(ωd t + φ) + ωd sin(ωd t + φ))
  if (gamma < w0) {
    const wd = Math.sqrt(w0 * w0 - gamma * gamma); // damped frequency

    const D = x0;
    const E = (v0 + gamma * x0) / wd;

    const C = Math.sqrt(D * D + E * E);
    const phi = Math.atan2(-E, D);

    const decay = Math.exp(-gamma * t);
    const angle = wd * t + phi;

    return {
      x: C * decay * Math.cos(angle),
      v: -C * decay * (gamma * Math.cos(angle) + wd * Math.sin(angle)),
    };
  }

  // Critically Damped
  // x(t) = (A + Bt) e^(-γt)
  // v(t) = (B - γ(A + Bt)) e^(-γt)
  if (gamma === w0) {
    const A = x0;
    const B = v0 + gamma * x0;

    const decay = Math.exp(-gamma * t);

    return {
      x: (A + B * t) * decay,
      v: (B - gamma * (A + B * t)) * decay,
    };
  }

  // Overdamped
  // x(t) = A e^(r1 t) + B e^(r2 t)
  // v(t) = r1 A e^(r1 t) + r2 B e^(r2 t)
  const root = Math.sqrt(gamma * gamma - w0 * w0);
  const r1 = -gamma + root;
  const r2 = -gamma - root;

  const A = (v0 - r2 * x0) / (r1 - r2);
  const B = (r1 * x0 - v0) / (r1 - r2);

  return {
    x: A * Math.exp(r1 * t) + B * Math.exp(r2 * t),
    v: r1 * A * Math.exp(r1 * t) + r2 * B * Math.exp(r2 * t),
  };
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
      const gamma = damping / (2 * mass);

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

      // Decay envelope ±e^(-γt) · ω0 / ωd
      if (gamma < w0) {
        const scale = w0 / Math.sqrt(w0 * w0 - gamma * gamma);
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (const sign of [1, -1]) {
          ctx.beginPath();
          for (let px = left; px <= right; px++) {
            const t = ((px - left) / (right - left)) * OSCILLATOR_DURATION;
            const y = toY(sign * scale * Math.exp(-gamma * t));
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
        const y = toY(dampedOscillator(t, paramsRef.current).x);
        if (px === left) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      const regime =
        gamma < w0
          ? "underdamped"
          : gamma === w0
            ? "critically damped"
            : "overdamped";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(`γ = ${gamma.toFixed(2)}  ·  ${regime}`, right, 10);
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
    if (Math.abs(dampedOscillator(t, params).x) > SPRING_REST_DELTA) last = t;
  }
  return last + dt;
}

/** Progress 0 → 1 at normalized time p (0 → 1). */
function springEasing(p: number, params: OscillatorParams, settle: number) {
  return 1 - dampedOscillator(p * settle, params).x;
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

const SPRING_FOLLOW_SCROLL = 120;
const SPRING_FOLLOW_BALL_RADIUS = 10;

type FollowSample = { time: number; y: number; target: number };

/** A ball at a fixed x follows the pointer's y with the spring; its path scrolls to the left. */
export function SpringFollowGraph({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef(OSCILLATOR_DEFAULTS);
  const [params, setParams] = useState(OSCILLATOR_DEFAULTS);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

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
    let lastTime = 0;
    let clock = 0;
    let y = 0;
    let velocity = 0;
    let target = 0;
    let samples: FollowSample[] = [];

    const ballX = () => width * 0.8;

    const drawPath = (key: "y" | "target") => {
      ctx.beginPath();
      samples.forEach((sample, i) => {
        const x = ballX() - (clock - sample.time) * SPRING_FOLLOW_SCROLL;
        if (i === 0) ctx.moveTo(x, sample[key]);
        else ctx.lineTo(x, sample[key]);
      });
      ctx.stroke();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const { mass, stiffness, damping } = paramsRef.current;
      const w0 = Math.sqrt(stiffness / mass);
      const gamma = damping / (2 * mass);
      const regime =
        gamma < w0
          ? "underdamped"
          : gamma === w0
            ? "critically damped"
            : "overdamped";

      // Target path and current target
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      drawPath("target");
      ctx.beginPath();
      ctx.moveTo(ballX(), target);
      ctx.lineTo(width, target);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ball path
      ctx.strokeStyle = primary;
      ctx.lineWidth = 2;
      drawPath("y");

      ctx.beginPath();
      ctx.arc(ballX(), y, SPRING_FOLLOW_BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(regime, 12, 12);
      ctx.fillStyle = muted;
      ctx.fillText(`γ = ${gamma.toFixed(2)}  ·  ω₀ = ${w0.toFixed(2)}`, 12, 28);
      ctx.textBaseline = "bottom";
      ctx.fillText("move the pointer up and down", 12, height - 10);
    };

    const update = (dt: number) => {
      clock += dt;
      const { x, v } = dampedOscillator(dt, {
        ...paramsRef.current,
        x0: y - target,
        v0: velocity,
      });
      y = target + x;
      velocity = v;

      samples.push({ time: clock, y, target });
      const maxAge = ballX() / SPRING_FOLLOW_SCROLL;
      samples = samples.filter((sample) => clock - sample.time <= maxAge);
    };

    const readPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target = Math.min(
        Math.max(event.clientY - rect.top, SPRING_FOLLOW_BALL_RADIUS),
        height - SPRING_FOLLOW_BALL_RADIUS,
      );
    };

    canvas.addEventListener("pointerdown", readPointer);
    canvas.addEventListener("pointermove", readPointer);

    const tick = (time: number) => {
      raf = 0;
      if (!running || !visible) return;
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
      lastTime = time;
      if (dt > 0) update(dt);
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
      const first = width === 0 || height === 0;
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      if (first) {
        y = height / 2;
        target = height / 2;
      }
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
      canvas.removeEventListener("pointerdown", readPointer);
      canvas.removeEventListener("pointermove", readPointer);
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
          Spring · follow the pointer
        </CVSubHeading>
        <PointerEventHandler asChild type="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Reset spring follow graph"
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
      <div className="relative aspect-2/1 w-full touch-none select-none">
        <canvas
          ref={canvasRef}
          aria-label="A ball that springs toward the pointer's height, with its path scrolling to the left"
          className="h-full w-full cursor-ns-resize"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const DAMPING_SPRING_DEFAULTS: OscillatorParams = {
  mass: 1,
  stiffness: 40,
  damping: 2,
};
const DAMPING_SPRING_BALL_RADIUS = 12;

/**
 * A ball hanging from a spring, moved by the exact solution x(t) of the damped harmonic oscillator.
 * Drag the ball to pull it; release to let it settle. Reset replays it from the default pull.
 */
export function DampingSpring({
  className,
  mass = DAMPING_SPRING_DEFAULTS.mass,
  stiffness = DAMPING_SPRING_DEFAULTS.stiffness,
  damping = DAMPING_SPRING_DEFAULTS.damping,
}: { className?: string } & Partial<OscillatorParams>) {
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

    const params: OscillatorParams = { mass, stiffness, damping };
    const w0 = Math.sqrt(stiffness / mass);
    const gamma = damping / (2 * mass);
    const regime =
      gamma < w0
        ? "underdamped"
        : gamma === w0
          ? "critically damped"
          : "overdamped";
    const settle = springSettleTime(params);

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
    let lastTime = 0;
    let t = 0;
    /** Starting displacement, in units of the default pull (1 = 30% of the height). */
    let start = 1;
    let dragOffset = 0;

    const geometry = () => {
      const anchorY = 0;
      const restY = height * 0.5;
      const pull = height * 0.3;
      return { anchorX: width / 2, anchorY, restY, pull };
    };

    const displacement = () =>
      dragging ? dragOffset : start * dampedOscillator(t, params).x;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const { anchorX, anchorY, restY, pull } = geometry();
      const x = displacement();
      const ballY = restY + x * pull;

      // Rest position
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(anchorX - 48, restY);
      ctx.lineTo(anchorX + 48, restY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("rest", anchorX + 54, restY);

      // Spring and anchor
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(anchorX, ballY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Ball
      ctx.beginPath();
      ctx.arc(anchorX, ballY, DAMPING_SPRING_BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(regime, 12, 12);
      ctx.fillStyle = muted;
      ctx.fillText(`γ = ${gamma.toFixed(2)}  ·  ω₀ = ${w0.toFixed(2)}`, 12, 28);
      ctx.fillText(`x = ${x.toFixed(2)}`, 12, 44);
      ctx.textBaseline = "bottom";
      ctx.fillText("drag the ball", 12, height - 10);
    };

    const update = (dt: number) => {
      if (dragging || t > settle) return;
      t += dt;
    };

    const reset = () => {
      t = 0;
      start = 1;
      draw();
    };

    resetRef.current = reset;

    const readPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { restY, pull } = geometry();
      const y = Math.min(
        Math.max(event.clientY - rect.top, DAMPING_SPRING_BALL_RADIUS),
        height - DAMPING_SPRING_BALL_RADIUS,
      );
      dragOffset = (y - restY) / pull;
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
      if (!dragging) return;
      dragging = false;
      start = dragOffset;
      t = 0;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const tick = (time: number) => {
      raf = 0;
      if (!running || !visible) return;
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0;
      lastTime = time;
      if (playingRef.current) {
        update(dt);
        draw();
      }
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
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, [mass, stiffness, damping]);

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <CVSubHeading className="uppercase text-muted-foreground">
          Damped spring
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={`${playing ? "Stop" : "Play"} damped spring sketch`}
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
              aria-label="Reset damped spring sketch"
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
          aria-label="A ball hanging from a spring, bouncing and settling as a damped harmonic oscillator"
          className="h-full w-full cursor-grab active:cursor-grabbing"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}
