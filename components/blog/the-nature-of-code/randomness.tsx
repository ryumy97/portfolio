"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { CVSubHeading } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";

const BINS = 4;
const SAMPLES_PER_TICK = 12;
const MONTE_CARLO_BINS = 20;
const MONTE_CARLO_SAMPLES_PER_TICK = 6;
const MONTE_CARLO_TICK_MS = 16;
const MONTE_CARLO_TARGET_SAMPLES = 200;
const LABEL_SPACE = 32;
const AXIS_SPACE = 32;
const DIRECTION_LABELS = ["Left", "Right", "Top", "Bottom"] as const;
const UNIFORM_DIRECTIONS = ["right", "left", "down", "up"] as const;
const BIASED_DIRECTIONS = ["right", "right", "left", "up", "down"] as const;
const HEIGHT_MIN_CM = 140;
const HEIGHT_MAX_CM = 210;
const HEIGHT_TICKS_CM = [150, 160, 170, 180, 190, 200] as const;
const MALE_HEIGHT = { mean: 175.4, sd: 7.4 };
const FEMALE_HEIGHT = { mean: 161.8, sd: 7.1 };

type Direction = (typeof UNIFORM_DIRECTIONS)[number];

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

function gaussianPdf(x: number, mean: number, sd: number) {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

function drawBellCurve(
  ctx: CanvasRenderingContext2D,
  mean: number,
  sd: number,
  maxPdf: number,
  width: number,
  height: number,
  color: string,
) {
  const plotHeight = Math.max(height - LABEL_SPACE, 1);
  const baseline = height - LABEL_SPACE;
  const range = HEIGHT_MAX_CM - HEIGHT_MIN_CM;

  const yAt = (x: number) => {
    const cm = HEIGHT_MIN_CM + (x / width) * range;
    return baseline - (gaussianPdf(cm, mean, sd) / maxPdf) * plotHeight;
  };

  ctx.beginPath();
  ctx.moveTo(0, baseline);
  for (let x = 0; x <= width; x += 1) {
    ctx.lineTo(x, yAt(x));
  }
  ctx.lineTo(width, baseline);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.45;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.moveTo(0, yAt(0));
  for (let x = 1; x <= width; x += 1) {
    ctx.lineTo(x, yAt(x));
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

class Walker {
  x = 0;
  y = 0;
  probabilities: readonly Direction[];
  stepSize: () => number;

  constructor(
    width: number,
    height: number,
    probabilities: readonly Direction[] = UNIFORM_DIRECTIONS,
    stepSize: () => number = () => 1,
  ) {
    this.x = width / 2;
    this.y = height / 2;
    this.probabilities = probabilities;
    this.stepSize = stepSize;
  }

  display(ctx: CanvasRenderingContext2D, fill: string) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.rect(this.x, this.y, 1, 1);
    ctx.fill();
  }

  step() {
    const choice = Math.floor(Math.random() * this.probabilities.length);
    const size = this.stepSize();
    switch (this.probabilities[choice]) {
      case "right":
        this.x += size;
        break;
      case "left":
        this.x -= size;
        break;
      case "up":
        this.y -= size;
        break;
      case "down":
        this.y += size;
        break;
    }
  }
}

function levyStepSize() {
  if (Math.random() < 0.01) {
    return Math.floor(20 + Math.random() * 80);
  }
  return 1;
}

export type ProbabilityFunction = (x: number) => number;

export function linearProbability(x: number) {
  return x;
}

export function exponentialProbability(x: number) {
  return Math.exp(-x);
}

function probabilityMax(probabilityFunction: ProbabilityFunction) {
  let max = 0;
  for (let i = 0; i <= 200; i += 1) {
    max = Math.max(max, probabilityFunction(i / 200));
  }
  return max;
}

function asProbability(
  probabilityFunction: ProbabilityFunction,
): ProbabilityFunction {
  const max = Math.max(1, probabilityMax(probabilityFunction));
  return (x) => probabilityFunction(x) / max;
}

function montecarlo(probabilityFunction: ProbabilityFunction) {
  while (true) {
    const r1 = Math.random();
    const probability = probabilityFunction(r1);
    const r2 = Math.random();
    if (r2 < probability) {
      return r1;
    }
  }
}

function probabilityArea(probabilityFunction: ProbabilityFunction) {
  const steps = 200;
  let sum = 0;
  for (let i = 0; i < steps; i += 1) {
    sum += Math.max(0, probabilityFunction((i + 0.5) / steps));
  }
  return sum / steps;
}

function linearPlotBounds(width: number, height: number) {
  return {
    left: AXIS_SPACE,
    right: width - 12,
    top: 12,
    bottom: height - LABEL_SPACE,
  };
}

function drawLinearPlot(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  fill = true,
  probabilityFunction: ProbabilityFunction = linearProbability,
) {
  const { left, right, top, bottom } = linearPlotBounds(width, height);
  if (right <= left || bottom <= top) return;

  const plotW = right - left;
  const plotH = bottom - top;
  const yAt = (t: number) => {
    const y = probabilityFunction(t);
    return bottom - Math.min(1, Math.max(0, y)) * plotH;
  };

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  if (fill) {
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    for (let i = 0; i <= plotW; i += 1) {
      ctx.lineTo(left + i, yAt(i / plotW));
    }
    ctx.lineTo(right, bottom);
    ctx.closePath();
    ctx.globalAlpha = 0.2;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.beginPath();
  ctx.moveTo(left, yAt(0));
  for (let i = 1; i <= plotW; i += 1) {
    ctx.lineTo(left + i, yAt(i / plotW));
  }
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();
}

function LinearPlotLabels({ yLabel = "y" }: { yLabel?: string }) {
  const rotateY = yLabel.length > 1;

  return (
    <div className="pointer-events-none absolute inset-0">
      <CVSubHeading className="absolute bottom-2 left-8 text-muted-foreground">
        0
      </CVSubHeading>
      <CVSubHeading className="absolute right-3 bottom-2 text-muted-foreground">
        1
      </CVSubHeading>
      <CVSubHeading className="absolute bottom-2 left-1/2 -translate-x-1/2 italic text-muted-foreground">
        x
      </CVSubHeading>
      <CVSubHeading className="absolute top-3 left-2 text-muted-foreground">
        1
      </CVSubHeading>
      <CVSubHeading className="absolute bottom-10 left-2 text-muted-foreground">
        0
      </CVSubHeading>
      <CVSubHeading
        className={cn(
          "absolute italic text-muted-foreground",
          rotateY
            ? "top-1/2 left-3.5 -translate-x-1/2 -translate-y-1/2 -rotate-90"
            : "top-1/2 left-2 -translate-y-1/2",
        )}
      >
        {yLabel}
      </CVSubHeading>
    </div>
  );
}

function SketchShell({
  className,
  canvasRef,
  ariaLabel,
  resetLabel,
  stopLabel,
  playLabel,
  controlsClassName,
  playing = true,
  onReset,
  onTogglePlaying,
  children,
}: {
  className?: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  ariaLabel: string;
  resetLabel?: string;
  stopLabel?: string;
  playLabel?: string;
  controlsClassName?: string;
  playing?: boolean;
  onReset?: () => void;
  onTogglePlaying?: () => void;
  children?: ReactNode;
}) {
  const showControls = Boolean(onReset || onTogglePlaying);

  return (
    <div
      className={cn(
        "relative mt-6 aspect-2/1 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        aria-label={ariaLabel}
        className="h-full w-full"
        style={CANVAS_STYLE}
      />
      {children}
      {showControls ? (
        <div
          className={cn(
            "absolute z-10 flex flex-col gap-2",
            controlsClassName ?? "right-2 bottom-2",
          )}
        >
          {onTogglePlaying ? (
            <PointerEventHandler asChild type="hide">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full bg-background"
                aria-label={playing ? stopLabel : playLabel}
                onClick={onTogglePlaying}
              >
                {playing ? <Square /> : <Play />}
              </Button>
            </PointerEventHandler>
          ) : null}
          {onReset ? (
            <PointerEventHandler asChild type="hide">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full bg-background"
                aria-label={resetLabel}
                onClick={onReset}
              >
                <RotateCcw />
              </Button>
            </PointerEventHandler>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function WalkerSketch({
  className,
  probabilities,
  stepSize,
  connectSteps = false,
  ariaLabel,
  resetLabel,
  stopLabel,
  playLabel,
}: {
  className?: string;
  probabilities: readonly Direction[];
  stepSize?: () => number;
  connectSteps?: boolean;
  ariaLabel: string;
  resetLabel: string;
  stopLabel: string;
  playLabel: string;
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
    let walker: Walker | null = null;
    let color = "#1e1e1e";
    let timer = 0;
    let running = true;
    let visible = false;

    const reset = () => {
      if (width <= 0 || height <= 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      walker = new Walker(width, height, probabilities, stepSize);
    };

    resetRef.current = reset;

    const stopTimer = () => {
      window.clearTimeout(timer);
      timer = 0;
    };

    const tick = () => {
      timer = 0;
      if (!running || !visible) return;
      if (playingRef.current && walker) {
        const prevX = walker.x;
        const prevY = walker.y;
        walker.step();
        if (connectSteps) {
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(walker.x, walker.y);
          ctx.stroke();
        }
        walker.display(ctx, color);
      }
      timer = window.setTimeout(tick, 16);
    };

    const startTimer = () => {
      if (!running || !visible || timer) return;
      tick();
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size, changed) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      color = getComputedStyle(canvas).color || color;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!changed && walker) return;
      reset();
    });

    const disconnectVisibility = observeElementVisible(canvas, (isVisible) => {
      visible = isVisible;
      if (visible) {
        startTimer();
        return;
      }
      stopTimer();
    });

    return () => {
      running = false;
      stopTimer();
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, [connectSteps, probabilities, stepSize]);

  return (
    <SketchShell
      className={className}
      canvasRef={canvasRef}
      ariaLabel={ariaLabel}
      resetLabel={resetLabel}
      stopLabel={stopLabel}
      playLabel={playLabel}
      playing={playing}
      onReset={() => resetRef.current()}
      onTogglePlaying={() => setPlaying((current) => !current)}
    />
  );
}

export function RandomWalk({ className }: { className?: string }) {
  return (
    <WalkerSketch
      className={className}
      probabilities={UNIFORM_DIRECTIONS}
      ariaLabel="Random walk on a 2D canvas"
      resetLabel="Reset random walk"
      stopLabel="Stop random walk"
      playLabel="Play random walk"
    />
  );
}

export function BiasedRandomWalk({ className }: { className?: string }) {
  return (
    <WalkerSketch
      className={className}
      probabilities={BIASED_DIRECTIONS}
      ariaLabel="Biased random walk on a 2D canvas"
      resetLabel="Reset biased random walk"
      stopLabel="Stop biased random walk"
      playLabel="Play biased random walk"
    />
  );
}

export function LevyFlightWalk({ className }: { className?: string }) {
  return (
    <WalkerSketch
      className={className}
      probabilities={UNIFORM_DIRECTIONS}
      stepSize={levyStepSize}
      connectSteps
      ariaLabel="Levy flight walk on a 2D canvas"
      resetLabel="Reset levy flight walk"
      stopLabel="Stop levy flight walk"
      playLabel="Play levy flight walk"
    />
  );
}

export function UniformDistribution({ className }: { className?: string }) {
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
    let timer = 0;
    let running = true;
    let visible = false;
    const counts = new Array<number>(BINS).fill(0);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      let total = 0;
      for (const count of counts) {
        total += count;
      }
      if (total === 0) return;

      const slot = width / BINS;
      const gap = Math.max(8, slot * 0.2);
      const barWidth = Math.max(slot - gap, 1);
      const plotHeight = Math.max(height - LABEL_SPACE, 1);

      ctx.fillStyle = color;
      for (let i = 0; i < BINS; i += 1) {
        const percent = counts[i] / total;
        const barHeight = percent * plotHeight;
        if (barHeight <= 0) continue;
        ctx.fillRect(
          i * slot + gap / 2,
          height - LABEL_SPACE - barHeight,
          barWidth,
          barHeight,
        );
      }
    };

    const reset = () => {
      counts.fill(0);
      draw();
    };

    resetRef.current = reset;

    const tick = () => {
      if (!running || !visible || width <= 0 || !playingRef.current) return;
      for (let i = 0; i < SAMPLES_PER_TICK; i += 1) {
        counts[Math.floor(Math.random() * BINS)] += 1;
      }
      draw();
    };

    const stopTimer = () => {
      window.clearInterval(timer);
      timer = 0;
    };

    const startTimer = () => {
      if (!running || !visible || timer) return;
      timer = window.setInterval(tick, 16);
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
        startTimer();
        return;
      }
      stopTimer();
    });

    return () => {
      running = false;
      stopTimer();
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, []);

  return (
    <SketchShell
      className={className}
      canvasRef={canvasRef}
      ariaLabel="Uniform random distribution as a bar chart"
      resetLabel="Reset uniform distribution"
      stopLabel="Stop uniform distribution"
      playLabel="Play uniform distribution"
      controlsClassName="right-2 top-2"
      playing={playing}
      onReset={() => resetRef.current()}
      onTogglePlaying={() => setPlaying((current) => !current)}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 grid h-8 grid-cols-4">
        {DIRECTION_LABELS.map((label) => (
          <CVSubHeading
            key={label}
            className="self-center text-center uppercase text-muted-foreground"
          >
            {label}
          </CVSubHeading>
        ))}
      </div>
    </SketchShell>
  );
}

export function NormalDistribution({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let maleColor = "#1e1e1e";
    let femaleColor = "#f75d5d";

    const maxPdf = Math.max(
      gaussianPdf(MALE_HEIGHT.mean, MALE_HEIGHT.mean, MALE_HEIGHT.sd),
      gaussianPdf(FEMALE_HEIGHT.mean, FEMALE_HEIGHT.mean, FEMALE_HEIGHT.sd),
    );

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      drawBellCurve(
        ctx,
        MALE_HEIGHT.mean,
        MALE_HEIGHT.sd,
        maxPdf,
        width,
        height,
        maleColor,
      );
      drawBellCurve(
        ctx,
        FEMALE_HEIGHT.mean,
        FEMALE_HEIGHT.sd,
        maxPdf,
        width,
        height,
        femaleColor,
      );
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      maleColor = styles.color || maleColor;
      femaleColor = styles.getPropertyValue("--primary").trim() || femaleColor;
      draw();
    });

    return () => {
      disconnectResize();
    };
  }, []);

  return (
    <SketchShell
      className={className}
      canvasRef={canvasRef}
      ariaLabel="Normal distributions of male and female adult height"
    >
      <div className="pointer-events-none absolute top-2 left-2 flex gap-4">
        <CVSubHeading className="uppercase text-foreground">Male</CVSubHeading>
        <CVSubHeading className="uppercase text-primary">Female</CVSubHeading>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8">
        {HEIGHT_TICKS_CM.map((tick) => (
          <div
            key={tick}
            className="absolute bottom-2 -translate-x-1/2"
            style={{
              left: `${((tick - HEIGHT_MIN_CM) / (HEIGHT_MAX_CM - HEIGHT_MIN_CM)) * 100}%`,
            }}
          >
            <CVSubHeading className="uppercase text-muted-foreground">
              {tick}
            </CVSubHeading>
          </div>
        ))}
      </div>
    </SketchShell>
  );
}

export function LinearGraph({ className }: { className?: string }) {
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

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;
      drawLinearPlot(ctx, width, height, color);
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      color = getComputedStyle(canvas).color || color;
      draw();
    });

    return () => {
      disconnectResize();
    };
  }, []);

  return (
    <SketchShell
      className={className}
      canvasRef={canvasRef}
      ariaLabel="Graph of y equals x, the probability of picking value x"
    >
      <LinearPlotLabels />
    </SketchShell>
  );
}

export function MonteCarlo({
  className,
  probabilityFunction = linearProbability,
}: {
  className?: string;
  probabilityFunction?: ProbabilityFunction;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const playingRef = useRef(true);
  const probabilityRef = useRef(probabilityFunction);
  const [playing, setPlaying] = useState(true);
  playingRef.current = playing;
  probabilityRef.current = probabilityFunction;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let color = "#1e1e1e";
    let timer = 0;
    let running = true;
    let visible = false;
    const counts = new Array<number>(MONTE_CARLO_BINS).fill(0);
    let sampledFunction: ProbabilityFunction | null = null;
    let probability: ProbabilityFunction = linearProbability;

    const currentProbability = () => {
      const fn = probabilityRef.current;
      if (fn !== sampledFunction) {
        sampledFunction = fn;
        probability = asProbability(fn);
      }
      return probability;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const { left, right, top, bottom } = linearPlotBounds(width, height);
      const plotW = right - left;
      const plotH = bottom - top;
      if (plotW <= 0 || plotH <= 0) return;

      const probabilityFn = currentProbability();

      let total = 0;
      for (const count of counts) {
        total += count;
      }

      if (total > 0) {
        const slot = plotW / MONTE_CARLO_BINS;
        const gap = Math.max(1, slot * 0.15);
        const barWidth = Math.max(slot - gap, 1);
        const area = Math.max(
          probabilityArea(probabilityFn),
          1 / MONTE_CARLO_BINS,
        );
        const scale = MONTE_CARLO_BINS * area * plotH;
        const denom = Math.max(total, MONTE_CARLO_TARGET_SAMPLES);

        ctx.fillStyle = color;
        for (let i = 0; i < MONTE_CARLO_BINS; i += 1) {
          const barHeight = Math.min((counts[i] / denom) * scale, plotH);
          if (barHeight <= 0) continue;
          ctx.fillRect(
            left + i * slot + gap / 2,
            bottom - barHeight,
            barWidth,
            barHeight,
          );
        }
      }

      drawLinearPlot(ctx, width, height, color, false, probabilityFn);
    };

    const reset = () => {
      counts.fill(0);
      draw();
    };

    resetRef.current = reset;

    const tick = () => {
      if (!running || !visible || width <= 0 || !playingRef.current) return;
      const probabilityFn = currentProbability();
      for (let i = 0; i < MONTE_CARLO_SAMPLES_PER_TICK; i += 1) {
        const x = montecarlo(probabilityFn);
        const bin = Math.min(
          MONTE_CARLO_BINS - 1,
          Math.floor(x * MONTE_CARLO_BINS),
        );
        counts[bin] += 1;
      }
      draw();
    };

    const stopTimer = () => {
      window.clearInterval(timer);
      timer = 0;
    };

    const startTimer = () => {
      if (!running || !visible || timer) return;
      timer = window.setInterval(tick, MONTE_CARLO_TICK_MS);
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
        startTimer();
        return;
      }
      stopTimer();
    });

    return () => {
      running = false;
      stopTimer();
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, []);

  return (
    <SketchShell
      className={className}
      canvasRef={canvasRef}
      ariaLabel="Monte Carlo y equals x distribution as a bar chart"
      resetLabel="Reset monte carlo"
      stopLabel="Stop monte carlo"
      playLabel="Play monte carlo"
      controlsClassName="right-2 top-2"
      playing={playing}
      onReset={() => resetRef.current()}
      onTogglePlaying={() => setPlaying((current) => !current)}
    >
      <LinearPlotLabels yLabel="probability" />
    </SketchShell>
  );
}
