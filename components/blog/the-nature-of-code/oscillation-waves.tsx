"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

const TAU = Math.PI * 2;
const WAVE_DEFAULTS = { amplitude: 60, period: 120 };
const AMPLITUDE_MAX = 100;
const PERIOD_MIN = 30;
const PERIOD_MAX = 300;
const PERIOD_LERP = 0.1;

/**
 * angle += TAU / period; y = amplitude · sin(angle).
 * A ball oscillates on the left; its history scrolls right as a sine wave (1 frame = 1px).
 * Period eases toward the slider value so the wave stretches instead of jumping.
 */
export function AmplitudePeriodCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const drawRef = useRef(() => {});
  const playingRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  const [amplitude, setAmplitude] = useState(WAVE_DEFAULTS.amplitude);
  const [period, setPeriod] = useState(WAVE_DEFAULTS.period);
  const waveRef = useRef({ amplitude, period });
  playingRef.current = playing;
  waveRef.current = { amplitude, period };

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
    let angle = 0;
    let period = waveRef.current.period;

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

      // Amplitude slider is 0–100% of the available half-height.
      const maxAmplitude = height * 0.36;
      const amplitude =
        (waveRef.current.amplitude / AMPLITUDE_MAX) * maxAmplitude;
      const cy = height * 0.56;
      const x0 = 56;
      // dx pixels to the right of the ball is the angle dx frames ago.
      const valueAt = (dx: number) =>
        amplitude * Math.sin(angle - (TAU * dx) / period);
      const ballY = cy - valueAt(0);

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = muted;
      ctx.fillText(
        "angle += TAU / period  ·  y = amplitude × sin(angle)",
        12,
        12,
      );
      ctx.fillStyle = color;
      ctx.fillText(
        `angle += TAU / ${period.toFixed(1)}  ·  y = ${amplitude.toFixed(0)} × sin(${(angle % TAU).toFixed(2)}) = ${valueAt(0).toFixed(1)}`,
        12,
        28,
      );

      // Center line and ±amplitude guides
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, cy);
      ctx.lineTo(width - 12, cy);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, cy - amplitude);
      ctx.lineTo(width - 12, cy - amplitude);
      ctx.moveTo(x0, cy + amplitude);
      ctx.lineTo(width - 12, cy + amplitude);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // History: the pixel dx to the right of the ball shows the value dx frames ago.
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let dx = 0; x0 + dx <= width - 12; dx++) {
        const y = cy - valueAt(dx);
        if (dx === 0) ctx.moveTo(x0, y);
        else ctx.lineTo(x0 + dx, y);
      }
      ctx.stroke();

      // First crest far enough from the ball to annotate.
      // Crests sit where angle - TAU · dx / period = TAU · (k + 1/4).
      const phase = angle / TAU - 0.25;
      let crestDx = (phase - Math.floor(phase)) * period;
      while (crestDx < 48) crestDx += period;
      const crestX = x0 + crestDx;
      const crestY = cy - amplitude;

      if (amplitude > 4 && crestX < width - 40) {
        ctx.strokeStyle = primary;
        ctx.fillStyle = primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(crestX, cy);
        ctx.lineTo(crestX, crestY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(crestX, crestY);
        ctx.lineTo(crestX - 4, crestY + 7);
        ctx.lineTo(crestX + 4, crestY + 7);
        ctx.closePath();
        ctx.fill();
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        haloText("amplitude", crestX + 8, cy - amplitude / 2 - 7);
        haloText(
          `${amplitude.toFixed(0)}px`,
          crestX + 8,
          cy - amplitude / 2 + 7,
        );
      }

      const nextCrestX = crestX + period;
      if (nextCrestX < width - 12) {
        const bracketY = cy - amplitude - 18;
        ctx.strokeStyle = secondary;
        ctx.fillStyle = secondary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(crestX, bracketY + 6);
        ctx.lineTo(crestX, bracketY);
        ctx.lineTo(nextCrestX, bracketY);
        ctx.lineTo(nextCrestX, bracketY + 6);
        ctx.stroke();
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(nextCrestX, bracketY + 6);
        ctx.lineTo(nextCrestX, crestY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        haloText(
          `period = ${Math.round(period)} frames`,
          (crestX + nextCrestX) / 2,
          bracketY - 4,
        );
      }

      // The oscillating ball and its link to the wave
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 - 28, cy);
      ctx.lineTo(x0 - 28, ballY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x0 - 28, ballY, 9, 0, TAU);
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = muted;
      ctx.beginPath();
      ctx.moveTo(x0 - 19, ballY);
      ctx.lineTo(x0, ballY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = muted;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("1 frame = 1px  ·  older →", width - 12, height - 10);
    };

    drawRef.current = draw;

    const reset = () => {
      angle = 0;
      draw();
    };

    resetRef.current = reset;

    const tick = () => {
      raf = 0;
      if (!running || !visible) return;
      const target = waveRef.current.period;
      const easing = Math.abs(target - period) > 0.01;
      period = easing ? period + (target - period) * PERIOD_LERP : target;
      if (playingRef.current) {
        angle += TAU / period;
        draw();
      } else if (easing) {
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
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
      drawRef.current = () => {};
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: redraw when inputs change
  useEffect(() => {
    drawRef.current();
  }, [amplitude, period]);

  const reset = () => {
    setAmplitude(WAVE_DEFAULTS.amplitude);
    setPeriod(WAVE_DEFAULTS.period);
    resetRef.current();
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
          Amplitude · period
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={playing ? "Stop wave sketch" : "Play wave sketch"}
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
              aria-label="Reset wave sketch"
              onClick={reset}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-b border-border px-3 py-2 font-mono text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="w-20 text-primary">amplitude</span>
          <Slider
            className="flex-1"
            min={0}
            max={AMPLITUDE_MAX}
            step={1}
            value={[amplitude]}
            aria-label="Amplitude"
            onValueChange={([value]) => setAmplitude(value)}
          />
          <span className="w-16 text-right text-foreground">{amplitude}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 text-secondary">period</span>
          <Slider
            className="flex-1"
            min={PERIOD_MIN}
            max={PERIOD_MAX}
            step={1}
            value={[period]}
            aria-label="Period in frames"
            onValueChange={([value]) => setPeriod(value)}
          />
          <span className="w-16 text-right text-foreground">{period}f</span>
        </div>
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="A ball oscillating up and down, tracing a sine wave with its amplitude and period marked"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const SINE_WAVE_DEFAULTS = { amplitude: 80, angleVelocity: 0.05 };
const SINE_WAVE_START_STEP = 0.02;

/** Paints a sine wave across x: angle grows per pixel, startAngle grows per frame. */
export function SineWaveCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const drawRef = useRef(() => {});
  const playingRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  const [amplitude, setAmplitude] = useState(SINE_WAVE_DEFAULTS.amplitude);
  const [angleVelocity, setAngleVelocity] = useState(
    SINE_WAVE_DEFAULTS.angleVelocity,
  );
  const waveRef = useRef({ amplitude, angleVelocity });
  playingRef.current = playing;
  waveRef.current = { amplitude, angleVelocity };

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
    let startAngle = 0;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const { angleVelocity } = waveRef.current;
      const amplitude = Math.min(waveRef.current.amplitude, height * 0.45);

      let angle = startAngle;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= width; x++) {
        const y = height / 2 + amplitude * Math.sin(angle);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        angle += angleVelocity;
      }
      ctx.stroke();
    };

    drawRef.current = draw;

    const reset = () => {
      startAngle = 0;
      draw();
    };

    resetRef.current = reset;

    const tick = () => {
      raf = 0;
      if (!running || !visible) return;
      if (playingRef.current) {
        startAngle += SINE_WAVE_START_STEP;
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
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
      drawRef.current = () => {};
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: redraw when inputs change
  useEffect(() => {
    drawRef.current();
  }, [amplitude, angleVelocity]);

  const reset = () => {
    setAmplitude(SINE_WAVE_DEFAULTS.amplitude);
    setAngleVelocity(SINE_WAVE_DEFAULTS.angleVelocity);
    resetRef.current();
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
          Sine wave
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={
                playing ? "Stop sine wave sketch" : "Play sine wave sketch"
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
              aria-label="Reset sine wave sketch"
              onClick={reset}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-b border-border px-3 py-2 font-mono text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="w-28">amplitude</span>
          <Slider
            className="flex-1"
            min={0}
            max={100}
            step={1}
            value={[amplitude]}
            aria-label="Amplitude"
            onValueChange={([value]) => setAmplitude(value)}
          />
          <span className="w-12 text-right text-foreground">{amplitude}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28">angleVelocity</span>
          <Slider
            className="flex-1"
            min={0.005}
            max={0.2}
            step={0.005}
            value={[angleVelocity]}
            aria-label="Angle velocity"
            onValueChange={([value]) => setAngleVelocity(value)}
          />
          <span className="w-12 text-right text-foreground">
            {angleVelocity.toFixed(3)}
          </span>
        </div>
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="A sine wave painted across the canvas, scrolling as its start angle increases"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}
