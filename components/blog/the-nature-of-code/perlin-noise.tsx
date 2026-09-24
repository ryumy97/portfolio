"use client";

import {
  Line,
  OrbitControls,
  PerspectiveCamera,
  Text,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Play, RotateCcw, Square } from "lucide-react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { CVSubHeading } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";

const NOISE_STEP = 0.01;
const SCROLL_STEP = 0.01;
const TICK_MS = 16;
const GRAPH_POINTS = 8;
const DEFAULT_P = 2.3;
const FIELD_STEP = 0.045;
const FIELD_SCROLL = 0.008;

const GRAD2: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

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

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

function mulberry32(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Lattice values in [0, 1] for 1D value noise. */
function createValues1D(seed: number) {
  const next = mulberry32(seed);
  const values = new Float32Array(GRAPH_POINTS + 1);
  for (let i = 0; i <= GRAPH_POINTS; i += 1) {
    values[i] = next();
  }
  return values;
}

function clampP(value: number) {
  if (Number.isNaN(value)) return DEFAULT_P;
  return Math.min(GRAPH_POINTS - 0.001, Math.max(0, value));
}

function sampleValueNoise1D(values: Float32Array, p: number) {
  const x0 = Math.floor(p);
  const x1 = Math.min(x0 + 1, GRAPH_POINTS);
  const v0 = values[x0];
  const v1 = values[x1];
  const t = p - x0;
  const u = fade(t);
  const n = lerp(v0, v1, u);
  return { x0, x1, v0, v1, t, u, n };
}

function createPermutation(seed: number) {
  const next = mulberry32(seed);
  const order = Array.from({ length: 256 }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i += 1) {
    perm[i] = order[i];
    perm[i + 256] = order[i];
  }
  return { perm, next };
}

/** Classic 1D value noise. Returns values in [0, 1]. */
function createNoise(seed = 1) {
  const { perm, next } = createPermutation(seed);
  const values = new Float32Array(256);
  for (let i = 0; i < 256; i += 1) {
    values[i] = next();
  }

  return (x: number) => {
    const xi = Math.floor(x) & 255;
    const xf = x - Math.floor(x);
    const u = fade(xf);
    return lerp(values[perm[xi]], values[perm[xi + 1]], u);
  };
}

/** 2D value noise: fade-blend the four surrounding lattice values. */
function createValueNoise2D(seed = 1) {
  const { perm, next } = createPermutation(seed);
  const values = new Float32Array(256);
  for (let i = 0; i < 256; i += 1) {
    values[i] = next();
  }

  const at = (ix: number, iy: number) => values[perm[perm[ix] + iy]];

  return (x: number, y: number) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const x1 = lerp(at(xi, yi), at(xi + 1, yi), u);
    const x2 = lerp(at(xi, yi + 1), at(xi + 1, yi + 1), u);
    return lerp(x1, x2, v);
  };
}

/** Classic 2D gradient (Perlin) noise. Returns values in [0, 1]. */
function createGradientNoise2D(seed = 1) {
  const { perm } = createPermutation(seed);

  const influence = (ix: number, iy: number, dx: number, dy: number) => {
    const g = GRAD2[perm[perm[ix] + iy] & 7];
    return g[0] * dx + g[1] * dy;
  };

  return (x: number, y: number) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const n00 = influence(xi, yi, xf, yf);
    const n10 = influence(xi + 1, yi, xf - 1, yf);
    const n01 = influence(xi, yi + 1, xf, yf - 1);
    const n11 = influence(xi + 1, yi + 1, xf - 1, yf - 1);
    const x1 = lerp(n00, n10, u);
    const x2 = lerp(n01, n11, u);
    return (lerp(x1, x2, v) + 1) / 2;
  };
}

function parseColor(input: string) {
  const value = input.trim();
  const hex = value.replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
    };
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }
  const rgb = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgb) {
    return {
      r: Math.round(Number(rgb[1])),
      g: Math.round(Number(rgb[2])),
      b: Math.round(Number(rgb[3])),
    };
  }
  return { r: 30, g: 30, b: 30 };
}

function SketchFrame({
  className,
  canvasRef,
  ariaLabel,
  title,
  playing,
  stopLabel,
  playLabel,
  resetLabel,
  onTogglePlaying,
  onReset,
}: {
  className?: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  ariaLabel: string;
  title: string;
  playing: boolean;
  stopLabel: string;
  playLabel: string;
  resetLabel: string;
  onTogglePlaying: () => void;
  onReset: () => void;
}) {
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
      <div className="pointer-events-none absolute top-2 left-2">
        <CVSubHeading className="uppercase text-muted-foreground">
          {title}
        </CVSubHeading>
      </div>
      <div className="absolute right-2 bottom-2 z-10 flex flex-col gap-2">
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
      </div>
    </div>
  );
}

export function PerlinNoise({ className }: { className?: string }) {
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
    let start = 0;
    let noise = createNoise();

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let xoff = start;
      for (let x = 0; x < width; x += 1) {
        const y = noise(xoff) * height;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        xoff += NOISE_STEP;
      }
      ctx.stroke();
    };

    const reset = () => {
      noise = createNoise(Math.floor(Math.random() * 0xffffffff) || 1);
      start = 0;
      draw();
    };

    resetRef.current = reset;

    const stopTimer = () => {
      window.clearTimeout(timer);
      timer = 0;
    };

    const tick = () => {
      timer = 0;
      if (!running || !visible) return;
      if (playingRef.current) {
        start += SCROLL_STEP;
        draw();
      }
      timer = window.setTimeout(tick, TICK_MS);
    };

    const startTimer = () => {
      if (!running || !visible || timer) return;
      tick();
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
    <SketchFrame
      className={className}
      canvasRef={canvasRef}
      ariaLabel="One-dimensional Perlin noise graph over time"
      title="Perlin noise"
      playing={playing}
      stopLabel="Stop perlin noise"
      playLabel="Play perlin noise"
      resetLabel="Reset perlin noise"
      onTogglePlaying={() => setPlaying((current) => !current)}
      onReset={() => resetRef.current()}
    />
  );
}

export function GraphPaper1D({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState(1);
  const [pInput, setPInput] = useState(String(DEFAULT_P));
  const [p, setP] = useState(DEFAULT_P);
  const values = useMemo(() => createValues1D(seed), [seed]);
  const math = sampleValueNoise1D(values, p);

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

    const layout = () => {
      const left = 36;
      const right = width - 16;
      const top = 16;
      const bottom = height - 28;
      const plotW = Math.max(right - left, 1);
      const plotH = Math.max(bottom - top, 1);
      return { left, right, top, bottom, plotW, plotH };
    };

    const toScreen = (gx: number, n: number) => {
      const { left, bottom, plotW, plotH } = layout();
      return {
        x: left + (gx / GRAPH_POINTS) * plotW,
        y: bottom - Math.min(1, Math.max(0, n)) * plotH,
      };
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const result = sampleValueNoise1D(values, p);
      const { left, right, top, bottom, plotW, plotH } = layout();
      const point = toScreen(p, result.n);

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25;
      for (let i = 0; i <= GRAPH_POINTS; i += 1) {
        const x = left + (i / GRAPH_POINTS) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }
      for (const tick of [0, 0.25, 0.5, 0.75, 1]) {
        const y = bottom - tick * plotH;
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

      const bandLeft = toScreen(result.x0, 0).x;
      const bandRight = toScreen(result.x1, 0).x;
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = primary;
      ctx.fillRect(bandLeft, top, bandRight - bandLeft, plotH);
      ctx.globalAlpha = 1;

      for (let i = 0; i <= GRAPH_POINTS; i += 1) {
        const sx = left + (i / GRAPH_POINTS) * plotW;
        const active = i === result.x0 || i === result.x1;
        const lattice = toScreen(i, values[i]);

        ctx.globalAlpha = active ? 1 : 0.35;
        ctx.strokeStyle = active ? primary : muted;
        ctx.lineWidth = active ? 1.5 : 1;
        ctx.setLineDash(active ? [] : [3, 3]);
        ctx.beginPath();
        ctx.moveTo(sx, bottom);
        ctx.lineTo(lattice.x, lattice.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.fillStyle = active ? primary : color;
        ctx.arc(lattice.x, lattice.y, active ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      const steps = Math.max(Math.floor(plotW), 1);
      for (let i = 0; i <= steps; i += 1) {
        const gx = (i / steps) * GRAPH_POINTS;
        const n = sampleValueNoise1D(values, gx).n;
        const screen = toScreen(gx, n);
        if (i === 0) ctx.moveTo(screen.x, screen.y);
        else ctx.lineTo(screen.x, screen.y);
      }
      ctx.stroke();

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1.25;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(point.x, bottom);
      ctx.lineTo(point.x, point.y);
      ctx.lineTo(left, point.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(
        `(${p.toFixed(2)}, ${result.n.toFixed(3)})`,
        point.x + 8,
        point.y - 6,
      );
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
  }, [values, p]);

  const applyP = (raw: string) => {
    setPInput(raw);
    const next = Number(raw);
    if (raw.trim() === "" || Number.isNaN(next)) return;
    setP(clampP(next));
  };

  const commitP = () => {
    const next = clampP(Number(pInput));
    setP(next);
    setPInput(String(Number(next.toFixed(3))));
  };

  const reshuffle = () => {
    setSeed(Math.floor(Math.random() * 0xffffffff) || 1);
  };

  return (
    <div
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-3 py-3">
        <div className="flex flex-col gap-1">
          <CVSubHeading className="uppercase text-muted-foreground">
            Value noise · 1D
          </CVSubHeading>
          <label className="flex items-center gap-2 font-mono text-xs">
            <span className="uppercase text-muted-foreground">P</span>
            <PointerEventHandler asChild type="hide">
              <input
                type="number"
                min={0}
                max={GRAPH_POINTS}
                step={0.01}
                value={pInput}
                onChange={(event) => applyP(event.target.value)}
                onBlur={commitP}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                className="h-8 w-24 rounded border border-border bg-background px-2 text-right tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Sample point P"
              />
            </PointerEventHandler>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <CVSubHeading className="uppercase text-primary">
            n = {math.n.toFixed(3)}
          </CVSubHeading>
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label="Reshuffle lattice values"
              onClick={reshuffle}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>

      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="Graph of one-dimensional value noise n against sample point p"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
        <div className="pointer-events-none absolute inset-0">
          <CVSubHeading className="absolute bottom-1 left-1/2 -translate-x-1/2 italic text-muted-foreground">
            p
          </CVSubHeading>
          <CVSubHeading className="absolute top-1/2 left-2 -translate-x-1/2 -translate-y-1/2 -rotate-90 italic text-muted-foreground">
            n
          </CVSubHeading>
          <CVSubHeading className="absolute bottom-1 left-8 text-muted-foreground">
            0
          </CVSubHeading>
          <CVSubHeading className="absolute right-3 bottom-1 text-muted-foreground">
            {GRAPH_POINTS}
          </CVSubHeading>
          <CVSubHeading className="absolute top-2 left-3 text-muted-foreground">
            1
          </CVSubHeading>
          <CVSubHeading className="absolute bottom-8 left-3 text-muted-foreground">
            0
          </CVSubHeading>
        </div>
      </div>

      <div className="grid gap-2 border-t border-border px-3 py-3 font-mono text-[min(max(1vw,11px),13px)] leading-[1.45em] text-muted-foreground md:grid-cols-3">
        <div>
          <CVSubHeading className="mb-1 uppercase text-foreground">
            1 · Corners
          </CVSubHeading>
          <p>
            floor(P) = {math.x0}, ceil = {math.x1}
          </p>
        </div>
        <div>
          <CVSubHeading className="mb-1 uppercase text-foreground">
            2 · Lattice values
          </CVSubHeading>
          <p>
            v[{math.x0}] = {math.v0.toFixed(3)}
          </p>
          <p>
            v[{math.x1}] = {math.v1.toFixed(3)}
          </p>
        </div>
        <div>
          <CVSubHeading className="mb-1 uppercase text-foreground">
            3 · Fade blend
          </CVSubHeading>
          <p>t = {math.t.toFixed(3)}</p>
          <p>fade(t) = {math.u.toFixed(3)}</p>
          <p>
            n = lerp({math.v0.toFixed(3)}, {math.v1.toFixed(3)}, fade) ={" "}
            {math.n.toFixed(3)}
          </p>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_X = 0.35;
const DEFAULT_Y = 0.6;

function clamp01(value: number, fallback: number) {
  if (Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

function createCellValues2D(seed: number) {
  const next = mulberry32(seed);
  return {
    v00: next(),
    v10: next(),
    v01: next(),
    v11: next(),
  };
}

function sampleCell2D(
  corners: ReturnType<typeof createCellValues2D>,
  x: number,
  y: number,
) {
  const xf = clamp01(x, DEFAULT_X);
  const yf = clamp01(y, DEFAULT_Y);
  const u = fade(xf);
  const v = fade(yf);
  const nx0 = lerp(corners.v00, corners.v10, u);
  const nx1 = lerp(corners.v01, corners.v11, u);
  const n = lerp(nx0, nx1, v);
  return { xf, yf, u, v, nx0, nx1, n };
}

const CELL_SEGMENTS = 48;
const CELL_HEIGHT = 0.65;

type Grad2 = readonly [number, number];

type ThemeColors = {
  color: string;
  primary: string;
  muted: string;
  bg: string;
};

function useElementThemeColors(elementRef: RefObject<HTMLElement | null>) {
  const [colors, setColors] = useState<ThemeColors>({
    color: "#1e1e1e",
    primary: "#f75d5d",
    muted: "#9a9a9a",
    bg: "#ffffff",
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const read = () => {
      const styles = getComputedStyle(element);
      setColors({
        color: styles.color || "#1e1e1e",
        primary: styles.getPropertyValue("--primary").trim() || "#f75d5d",
        muted:
          styles.getPropertyValue("--muted-foreground").trim() || "#9a9a9a",
        bg: styles.backgroundColor || "#ffffff",
      });
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => observer.disconnect();
  }, [elementRef]);

  return colors;
}

function NoiseHeightSurface({
  getN,
  color,
}: {
  getN: (x: number, y: number) => number;
  color: string;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1, CELL_SEGMENTS, CELL_SEGMENTS);
    g.rotateX(-Math.PI / 2);
    g.translate(0.5, 0, 0.5);
    return g;
  }, []);

  useLayoutEffect(() => {
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getN(x, z) * CELL_HEIGHT);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [geometry, getN]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} wireframe side={THREE.DoubleSide} />
    </mesh>
  );
}

function UnitCellFloor({ color }: { color: string }) {
  return (
    <Line
      points={[
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 1],
        [0, 0, 1],
        [0, 0, 0],
      ]}
      color={color}
      transparent
      opacity={0.55}
      lineWidth={1}
    />
  );
}

function SampleMarker({
  x,
  y,
  n,
  color,
}: {
  x: number;
  y: number;
  n: number;
  color: string;
}) {
  return (
    <group position={[x, n * CELL_HEIGHT, y]}>
      <mesh>
        <sphereGeometry args={[0.028, 18, 18]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, -n * CELL_HEIGHT * 0.5, 0]}>
        <cylinderGeometry
          args={[0.004, 0.004, Math.max(n * CELL_HEIGHT, 0.001), 8]}
        />
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function CornerLabel({
  position,
  children,
  color,
}: {
  position: [number, number, number];
  children: string;
  color: string;
}) {
  return (
    <Text
      position={position}
      fontSize={0.05}
      color={color}
      anchorX="center"
      anchorY="middle"
      depthOffset={-1}
    >
      {children}
    </Text>
  );
}

function CornerValueMarkers({
  corners,
  primary,
  color,
}: {
  corners: ReturnType<typeof createCellValues2D>;
  primary: string;
  color: string;
}) {
  const items = [
    { x: 0, z: 0, v: corners.v00, name: "v00", ox: -0.08, oz: -0.08 },
    { x: 1, z: 0, v: corners.v10, name: "v10", ox: 0.08, oz: -0.08 },
    { x: 0, z: 1, v: corners.v01, name: "v01", ox: -0.08, oz: 0.08 },
    { x: 1, z: 1, v: corners.v11, name: "v11", ox: 0.08, oz: 0.08 },
  ];
  return (
    <group>
      {items.map((item) => (
        <group key={item.name}>
          <mesh position={[item.x, item.v * CELL_HEIGHT, item.z]}>
            <sphereGeometry args={[0.032, 16, 16]} />
            <meshBasicMaterial color={primary} />
          </mesh>
          <CornerLabel
            position={[
              item.x + item.ox,
              item.v * CELL_HEIGHT + 0.08,
              item.z + item.oz,
            ]}
            color={color}
          >
            {`${item.name} = ${item.v.toFixed(2)}`}
          </CornerLabel>
        </group>
      ))}
    </group>
  );
}

function GradientArrow({
  origin,
  dir,
  color,
  label,
  labelColor,
}: {
  origin: [number, number, number];
  dir: Grad2;
  color: string;
  label: string;
  labelColor: string;
}) {
  const length = 0.24;
  const quat = useMemo(() => {
    // Gradient is a 2D vector in the input plane (x, z) — keep the arrow flat.
    // Height rise is what the surface does when you move that way.
    const to = new THREE.Vector3(dir[0], 0, dir[1]).normalize();
    const from = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(from, to);
  }, [dir]);

  const labelOffsetX = origin[0] < 0.5 ? -0.12 : 0.12;
  const labelOffsetZ = origin[2] < 0.5 ? -0.12 : 0.12;

  return (
    <group position={[origin[0], origin[1] + 0.02, origin[2]]}>
      <mesh>
        <sphereGeometry args={[0.022, 14, 14]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <group quaternion={quat}>
        <mesh position={[0, length * 0.5, 0]}>
          <cylinderGeometry args={[0.006, 0.009, length, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, length + 0.03, 0]}>
          <coneGeometry args={[0.024, 0.06, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      <CornerLabel
        position={[labelOffsetX, 0.08, labelOffsetZ]}
        color={labelColor}
      >
        {`${label} (${dir[0]},${dir[1]})`}
      </CornerLabel>
    </group>
  );
}

/** Distance vectors from each corner to the sample, drawn on the floor (y = 0). */
function DistanceVectors({
  sampleX,
  sampleY,
  color,
}: {
  sampleX: number;
  sampleY: number;
  color: string;
}) {
  const corners = [
    { x: 0, z: 0, key: "00" },
    { x: 1, z: 0, key: "10" },
    { x: 0, z: 1, key: "01" },
    { x: 1, z: 1, key: "11" },
  ];

  return (
    <group>
      {corners.map((corner) => (
        <Line
          key={corner.key}
          points={[
            [corner.x, 0, corner.z],
            [sampleX, 0, sampleY],
          ]}
          color={color}
          dashed
          dashSize={0.035}
          gapSize={0.025}
          transparent
          opacity={0.55}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

function CellCamera() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[1.55, 1.25, 1.55]} fov={42} />
      <OrbitControls
        makeDefault
        target={[0.5, 0.2, 0.5]}
        enablePan={false}
        minDistance={1.1}
        maxDistance={3.2}
        maxPolarAngle={Math.PI * 0.48}
      />
    </>
  );
}

function createCellGradients2D(seed: number) {
  const next = mulberry32(seed);
  const pick = (): Grad2 => GRAD2[Math.floor(next() * GRAD2.length)];
  return {
    g00: pick(),
    g10: pick(),
    g01: pick(),
    g11: pick(),
  };
}

function sampleCellGradient2D(
  grads: ReturnType<typeof createCellGradients2D>,
  x: number,
  y: number,
) {
  const xf = clamp01(x, DEFAULT_X);
  const yf = clamp01(y, DEFAULT_Y);
  const u = fade(xf);
  const v = fade(yf);
  const n00 = grads.g00[0] * xf + grads.g00[1] * yf;
  const n10 = grads.g10[0] * (xf - 1) + grads.g10[1] * yf;
  const n01 = grads.g01[0] * xf + grads.g01[1] * (yf - 1);
  const n11 = grads.g11[0] * (xf - 1) + grads.g11[1] * (yf - 1);
  const nx0 = lerp(n00, n10, u);
  const nx1 = lerp(n01, n11, u);
  const raw = lerp(nx0, nx1, v);
  const n = (raw + 1) / 2;
  return { xf, yf, u, v, n00, n10, n01, n11, nx0, nx1, raw, n };
}

export function GraphPaper2D({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const colors = useElementThemeColors(rootRef);
  const [seed, setSeed] = useState(1);
  const [xInput, setXInput] = useState(String(DEFAULT_X));
  const [yInput, setYInput] = useState(String(DEFAULT_Y));
  const [x, setX] = useState(DEFAULT_X);
  const [y, setY] = useState(DEFAULT_Y);
  const corners = useMemo(() => createCellValues2D(seed), [seed]);
  const math = sampleCell2D(corners, x, y);
  const getN = useCallback(
    (px: number, py: number) => sampleCell2D(corners, px, py).n,
    [corners],
  );

  const applyX = (raw: string) => {
    setXInput(raw);
    const next = Number(raw);
    if (raw.trim() === "" || Number.isNaN(next)) return;
    setX(clamp01(next, DEFAULT_X));
  };

  const applyY = (raw: string) => {
    setYInput(raw);
    const next = Number(raw);
    if (raw.trim() === "" || Number.isNaN(next)) return;
    setY(clamp01(next, DEFAULT_Y));
  };

  const commitX = () => {
    const next = clamp01(Number(xInput), DEFAULT_X);
    setX(next);
    setXInput(String(Number(next.toFixed(3))));
  };

  const commitY = () => {
    const next = clamp01(Number(yInput), DEFAULT_Y);
    setY(next);
    setYInput(String(Number(next.toFixed(3))));
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-3 py-3">
        <div className="flex flex-col gap-2">
          <CVSubHeading className="uppercase text-muted-foreground">
            Value noise · 2D cell · 3D
          </CVSubHeading>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 font-mono text-xs">
              <span className="uppercase text-muted-foreground">x</span>
              <PointerEventHandler asChild type="hide">
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={xInput}
                  onChange={(event) => applyX(event.target.value)}
                  onBlur={commitX}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  className="h-8 w-20 rounded border border-border bg-background px-2 text-right tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label="Sample x"
                />
              </PointerEventHandler>
            </label>
            <label className="flex items-center gap-2 font-mono text-xs">
              <span className="uppercase text-muted-foreground">y</span>
              <PointerEventHandler asChild type="hide">
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={yInput}
                  onChange={(event) => applyY(event.target.value)}
                  onBlur={commitY}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  className="h-8 w-20 rounded border border-border bg-background px-2 text-right tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label="Sample y"
                />
              </PointerEventHandler>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CVSubHeading className="uppercase text-primary">
            n = {math.n.toFixed(3)}
          </CVSubHeading>
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label="Reshuffle corner values"
              onClick={() =>
                setSeed(Math.floor(Math.random() * 0xffffffff) || 1)
              }
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>

      <div className="relative aspect-square w-full sm:aspect-2/1">
        <Canvas
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false }}
          style={{ background: colors.bg }}
          aria-label="Three-dimensional value noise cell with height equal to n"
        >
          <color attach="background" args={[colors.bg]} />
          <CellCamera />
          <UnitCellFloor color={colors.muted} />
          <NoiseHeightSurface getN={getN} color={colors.color} />
          <CornerValueMarkers
            corners={corners}
            primary={colors.primary}
            color={colors.color}
          />
          <SampleMarker
            x={math.xf}
            y={math.yf}
            n={math.n}
            color={colors.primary}
          />
        </Canvas>
      </div>

      <div className="grid gap-2 border-t border-border px-3 py-3 font-mono text-[min(max(1vw,11px),13px)] leading-[1.45em] text-muted-foreground md:grid-cols-3">
        <div>
          <CVSubHeading className="mb-1 uppercase text-foreground">
            1 · Corners
          </CVSubHeading>
          <p>v00 = {corners.v00.toFixed(3)}</p>
          <p>v10 = {corners.v10.toFixed(3)}</p>
          <p>v01 = {corners.v01.toFixed(3)}</p>
          <p>v11 = {corners.v11.toFixed(3)}</p>
        </div>
        <div>
          <CVSubHeading className="mb-1 uppercase text-foreground">
            2 · Fade
          </CVSubHeading>
          <p>
            xf = {math.xf.toFixed(3)}, yf = {math.yf.toFixed(3)}
          </p>
          <p>fade(xf) = {math.u.toFixed(3)}</p>
          <p>fade(yf) = {math.v.toFixed(3)}</p>
        </div>
        <div>
          <CVSubHeading className="mb-1 uppercase text-foreground">
            3 · Blend
          </CVSubHeading>
          <p>nx0 = lerp(v00, v10, fade x) = {math.nx0.toFixed(3)}</p>
          <p>nx1 = lerp(v01, v11, fade x) = {math.nx1.toFixed(3)}</p>
          <p>n = lerp(nx0, nx1, fade y) = {math.n.toFixed(3)}</p>
        </div>
      </div>
    </div>
  );
}

export function GraphPaperGradient2D({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const colors = useElementThemeColors(rootRef);
  const [seed, setSeed] = useState(1);
  const [xInput, setXInput] = useState(String(DEFAULT_X));
  const [yInput, setYInput] = useState(String(DEFAULT_Y));
  const [x, setX] = useState(DEFAULT_X);
  const [y, setY] = useState(DEFAULT_Y);
  const grads = useMemo(() => createCellGradients2D(seed), [seed]);
  const math = sampleCellGradient2D(grads, x, y);
  const getN = useCallback(
    (px: number, py: number) => sampleCellGradient2D(grads, px, py).n,
    [grads],
  );
  const cornerHeights = useMemo(
    () => ({
      n00: sampleCellGradient2D(grads, 0, 0).n,
      n10: sampleCellGradient2D(grads, 1, 0).n,
      n01: sampleCellGradient2D(grads, 0, 1).n,
      n11: sampleCellGradient2D(grads, 1, 1).n,
    }),
    [grads],
  );

  const applyX = (raw: string) => {
    setXInput(raw);
    const next = Number(raw);
    if (raw.trim() === "" || Number.isNaN(next)) return;
    setX(clamp01(next, DEFAULT_X));
  };

  const applyY = (raw: string) => {
    setYInput(raw);
    const next = Number(raw);
    if (raw.trim() === "" || Number.isNaN(next)) return;
    setY(clamp01(next, DEFAULT_Y));
  };

  const commitX = () => {
    const next = clamp01(Number(xInput), DEFAULT_X);
    setX(next);
    setXInput(String(Number(next.toFixed(3))));
  };

  const commitY = () => {
    const next = clamp01(Number(yInput), DEFAULT_Y);
    setY(next);
    setYInput(String(Number(next.toFixed(3))));
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative mt-6 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-3 py-3">
        <div className="flex flex-col gap-2">
          <CVSubHeading className="uppercase text-muted-foreground">
            Gradient noise · 2D cell · 3D
          </CVSubHeading>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 font-mono text-xs">
              <span className="uppercase text-muted-foreground">x</span>
              <PointerEventHandler asChild type="hide">
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={xInput}
                  onChange={(event) => applyX(event.target.value)}
                  onBlur={commitX}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  className="h-8 w-20 rounded border border-border bg-background px-2 text-right tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label="Sample x"
                />
              </PointerEventHandler>
            </label>
            <label className="flex items-center gap-2 font-mono text-xs">
              <span className="uppercase text-muted-foreground">y</span>
              <PointerEventHandler asChild type="hide">
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={yInput}
                  onChange={(event) => applyY(event.target.value)}
                  onBlur={commitY}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  className="h-8 w-20 rounded border border-border bg-background px-2 text-right tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label="Sample y"
                />
              </PointerEventHandler>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CVSubHeading className="uppercase text-primary">
            n = {math.n.toFixed(3)}
          </CVSubHeading>
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label="Reshuffle corner gradients"
              onClick={() =>
                setSeed(Math.floor(Math.random() * 0xffffffff) || 1)
              }
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>

      <div className="relative aspect-square w-full sm:aspect-2/1">
        <Canvas
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false }}
          style={{ background: colors.bg }}
          aria-label="Three-dimensional gradient noise cell with height equal to n"
        >
          <color attach="background" args={[colors.bg]} />
          <CellCamera />
          <UnitCellFloor color={colors.muted} />
          <NoiseHeightSurface getN={getN} color={colors.color} />
          <GradientArrow
            origin={[0, cornerHeights.n00 * CELL_HEIGHT, 0]}
            dir={grads.g00}
            color={colors.primary}
            label="g00"
            labelColor={colors.color}
          />
          <GradientArrow
            origin={[1, cornerHeights.n10 * CELL_HEIGHT, 0]}
            dir={grads.g10}
            color={colors.primary}
            label="g10"
            labelColor={colors.color}
          />
          <GradientArrow
            origin={[0, cornerHeights.n01 * CELL_HEIGHT, 1]}
            dir={grads.g01}
            color={colors.primary}
            label="g01"
            labelColor={colors.color}
          />
          <GradientArrow
            origin={[1, cornerHeights.n11 * CELL_HEIGHT, 1]}
            dir={grads.g11}
            color={colors.primary}
            label="g11"
            labelColor={colors.color}
          />
          <DistanceVectors
            sampleX={math.xf}
            sampleY={math.yf}
            color={colors.primary}
          />
          <SampleMarker
            x={math.xf}
            y={math.yf}
            n={math.n}
            color={colors.primary}
          />
        </Canvas>
      </div>

      <div className="grid gap-2 border-t border-border px-3 py-3 font-mono text-[min(max(1vw,11px),13px)] leading-[1.45em] text-muted-foreground md:grid-cols-3">
        <div>
          <CVSubHeading className="mb-1 uppercase text-foreground">
            1 · Dot products
          </CVSubHeading>
          <p>g00·d = {math.n00.toFixed(3)}</p>
          <p>g10·d = {math.n10.toFixed(3)}</p>
          <p>g01·d = {math.n01.toFixed(3)}</p>
          <p>g11·d = {math.n11.toFixed(3)}</p>
        </div>
        <div>
          <CVSubHeading className="mb-1 uppercase text-foreground">
            2 · Fade
          </CVSubHeading>
          <p>
            xf = {math.xf.toFixed(3)}, yf = {math.yf.toFixed(3)}
          </p>
          <p>fade(xf) = {math.u.toFixed(3)}</p>
          <p>fade(yf) = {math.v.toFixed(3)}</p>
        </div>
        <div>
          <CVSubHeading className="mb-1 uppercase text-foreground">
            3 · Blend
          </CVSubHeading>
          <p>nx0 = lerp(n00, n10, fade x) = {math.nx0.toFixed(3)}</p>
          <p>nx1 = lerp(n01, n11, fade x) = {math.nx1.toFixed(3)}</p>
          <p>n = map(lerp(nx0, nx1, fade y)) = {math.n.toFixed(3)}</p>
        </div>
      </div>
    </div>
  );
}

const LINE_COMPARE_SEED = 7;
const LINE_COMPARE_POINTS = 12;

function sampleSmoothedValue(values: Float32Array, p: number) {
  const max = values.length - 1;
  const x0 = Math.min(max - 1, Math.max(0, Math.floor(p)));
  const x1 = x0 + 1;
  const t = p - x0;
  const u = (1 - Math.cos(t * Math.PI)) / 2;
  return lerp(values[x0], values[x1], u);
}

function RandomLineSketch({
  className,
  mode,
  title,
  ariaLabel,
}: {
  className?: string;
  mode: "jagged" | "smoothed";
  title: string;
  ariaLabel: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const values = useMemo(() => {
    const next = mulberry32(LINE_COMPARE_SEED);
    const list = new Float32Array(LINE_COMPARE_POINTS + 1);
    for (let i = 0; i <= LINE_COMPARE_POINTS; i += 1) {
      list[i] = 0.15 + next() * 0.7;
    }
    return list;
  }, []);

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

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const left = 36;
      const right = width - 16;
      const top = 28;
      const bottom = height - 20;
      const plotW = Math.max(right - left, 1);
      const plotH = Math.max(bottom - top, 1);
      const max = LINE_COMPARE_POINTS;

      const toScreen = (gx: number, n: number) => ({
        x: left + (gx / max) * plotW,
        y: bottom - n * plotH,
      });

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.75;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();

      if (mode === "jagged") {
        for (let i = 0; i <= max; i += 1) {
          const point = toScreen(i, values[i]);
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
      } else {
        const steps = Math.max(Math.floor(plotW), 1);
        for (let i = 0; i <= steps; i += 1) {
          const gx = (i / steps) * max;
          const point = toScreen(gx, sampleSmoothedValue(values, gx));
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();

      for (let i = 0; i <= max; i += 1) {
        const point = toScreen(i, values[i]);
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;
      draw();
    });

    draw();

    return () => {
      disconnectResize();
    };
  }, [mode, values]);

  return (
    <div
      className={cn(
        "relative mt-6 aspect-3/1 w-full overflow-hidden border border-border bg-background text-foreground",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        aria-label={ariaLabel}
        className="h-full w-full"
        style={CANVAS_STYLE}
      />
      <div className="pointer-events-none absolute top-2 left-2">
        <CVSubHeading className="uppercase text-muted-foreground">
          {title}
        </CVSubHeading>
      </div>
      <div className="pointer-events-none absolute inset-0">
        <CVSubHeading className="absolute top-8 left-3 text-muted-foreground">
          1
        </CVSubHeading>
        <CVSubHeading className="absolute bottom-5 left-3 text-muted-foreground">
          0
        </CVSubHeading>
      </div>
    </div>
  );
}

export function JaggedLine({ className }: { className?: string }) {
  return (
    <RandomLineSketch
      className={className}
      mode="jagged"
      title="Connected random numbers"
      ariaLabel="Jagged line connecting random lattice values"
    />
  );
}

export function SmoothedLine({ className }: { className?: string }) {
  return (
    <RandomLineSketch
      className={className}
      mode="smoothed"
      title="Smoothed line"
      ariaLabel="Smoothed line from linear interpolation between random lattice values"
    />
  );
}

export function FadeGraph({ className }: { className?: string }) {
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

      const left = 36;
      const right = width - 16;
      const top = 16;
      const bottom = height - 28;
      const plotW = Math.max(right - left, 1);
      const plotH = Math.max(bottom - top, 1);

      const toScreen = (t: number, y: number) => ({
        x: left + t * plotW,
        y: bottom - y * plotH,
      });

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25;
      for (const tick of [0, 0.25, 0.5, 0.75, 1]) {
        const x = left + tick * plotW;
        const y = bottom - tick * plotH;
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

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      {
        const a = toScreen(0, 0);
        const b = toScreen(1, 1);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const steps = Math.max(Math.floor(plotW), 1);
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const screen = toScreen(t, fade(t));
        if (i === 0) ctx.moveTo(screen.x, screen.y);
        else ctx.lineTo(screen.x, screen.y);
      }
      ctx.stroke();

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("y = t", left + 10, top + 8);
      ctx.fillStyle = primary;
      ctx.fillText("fade(t)", left + 10, top + 24);
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
          Fade · 6t⁵ − 15t⁴ + 10t³
        </CVSubHeading>
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label="Graph of the Perlin fade function against linear interpolation"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
        <div className="pointer-events-none absolute inset-0">
          <CVSubHeading className="absolute bottom-1 left-1/2 -translate-x-1/2 italic text-muted-foreground">
            t
          </CVSubHeading>
          <CVSubHeading className="absolute top-1/2 left-2 -translate-x-1/2 -translate-y-1/2 -rotate-90 italic text-muted-foreground">
            fade(t)
          </CVSubHeading>
          <CVSubHeading className="absolute bottom-1 left-8 text-muted-foreground">
            0
          </CVSubHeading>
          <CVSubHeading className="absolute right-3 bottom-1 text-muted-foreground">
            1
          </CVSubHeading>
          <CVSubHeading className="absolute top-2 left-3 text-muted-foreground">
            1
          </CVSubHeading>
          <CVSubHeading className="absolute bottom-8 left-3 text-muted-foreground">
            0
          </CVSubHeading>
        </div>
      </div>
    </div>
  );
}

function NoiseField2D({
  className,
  title,
  ariaLabel,
  mode,
  fieldStep = FIELD_STEP,
}: {
  className?: string;
  title: string;
  ariaLabel: string;
  mode: "value" | "gradient";
  fieldStep?: number;
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
    let bg = "#ffffff";
    let timer = 0;
    let running = true;
    let visible = false;
    let startX = 0;
    let startY = 0;
    let noise =
      mode === "value" ? createValueNoise2D() : createGradientNoise2D();
    const scroll = FIELD_SCROLL * (fieldStep / FIELD_STEP);
    const buffer = document.createElement("canvas");
    const bufferCtx = buffer.getContext("2d");
    if (!bufferCtx) return;

    const draw = () => {
      if (width <= 0 || height <= 0) return;

      const scale = Math.max(1, Math.round(dpr));
      const bw = Math.max(1, Math.floor(canvas.width / scale));
      const bh = Math.max(1, Math.floor(canvas.height / scale));
      const fg = parseColor(color);
      const background = parseColor(bg);

      if (buffer.width !== bw || buffer.height !== bh) {
        buffer.width = bw;
        buffer.height = bh;
      }

      const image = bufferCtx.createImageData(bw, bh);
      const data = image.data;

      for (let y = 0; y < bh; y += 1) {
        for (let x = 0; x < bw; x += 1) {
          const n = noise(startX + x * fieldStep, startY + y * fieldStep);
          const t = Math.min(1, Math.max(0, n));
          const i = (y * bw + x) * 4;
          data[i] = Math.round(background.r + (fg.r - background.r) * t);
          data[i + 1] = Math.round(background.g + (fg.g - background.g) * t);
          data[i + 2] = Math.round(background.b + (fg.b - background.b) * t);
          data[i + 3] = 255;
        }
      }

      bufferCtx.putImageData(image, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
    };

    const reset = () => {
      const seed = Math.floor(Math.random() * 0xffffffff) || 1;
      noise =
        mode === "value"
          ? createValueNoise2D(seed)
          : createGradientNoise2D(seed);
      startX = 0;
      startY = 0;
      draw();
    };

    resetRef.current = reset;

    const stopTimer = () => {
      window.clearTimeout(timer);
      timer = 0;
    };

    const tick = () => {
      timer = 0;
      if (!running || !visible) return;
      if (playingRef.current) {
        startX += scroll;
        startY += scroll * 0.6;
        draw();
      }
      timer = window.setTimeout(tick, 48);
    };

    const startTimer = () => {
      if (!running || !visible || timer) return;
      tick();
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      const parentStyles = canvas.parentElement
        ? getComputedStyle(canvas.parentElement)
        : styles;
      color = styles.color || color;
      bg = parentStyles.backgroundColor || styles.backgroundColor || bg;
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
  }, [mode, fieldStep]);

  return (
    <SketchFrame
      className={className}
      canvasRef={canvasRef}
      ariaLabel={ariaLabel}
      title={title}
      playing={playing}
      stopLabel={`Stop ${title.toLowerCase()}`}
      playLabel={`Play ${title.toLowerCase()}`}
      resetLabel={`Reset ${title.toLowerCase()}`}
      onTogglePlaying={() => setPlaying((current) => !current)}
      onReset={() => resetRef.current()}
    />
  );
}

export function ValueNoise2D({ className }: { className?: string }) {
  return (
    <NoiseField2D
      className={className}
      mode="value"
      title="Value noise · 2D"
      ariaLabel="Two-dimensional value noise field"
    />
  );
}

export function GradientNoise2D({ className }: { className?: string }) {
  return (
    <NoiseField2D
      className={className}
      mode="gradient"
      fieldStep={0.02}
      title="Gradient noise · 2D"
      ariaLabel="Two-dimensional gradient Perlin noise field"
    />
  );
}
