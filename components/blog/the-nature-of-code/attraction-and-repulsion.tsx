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

/** Newton's law of universal gravitation: F = G · m1 · m2 / d² toward attractor. */
function attract(
  attractor: Ball,
  mover: Ball,
  G: number,
  minDist = 5,
  maxDist = Number.POSITIVE_INFINITY,
) {
  const force = Vector2D.sub(attractor.position, mover.position);
  let distance = force.magnitude();
  distance = Math.min(Math.max(distance, minDist), maxDist);
  const strength = (G * attractor.mass * mover.mass) / (distance * distance);
  force.normalize();
  force.multiply(strength);
  return force;
}

const G = 0.5;
const SUN_MASS = 500;
const EARTH_MASS = 80;
const MOON_MASS = 1;
const SUN_RADIUS = 20;
const EARTH_RADIUS = 9;
const MOON_RADIUS = 4;
/** Earth–Moon distance — keep small vs Sun–Earth so the Moon stays in Earth's gravity well. */
const MOON_ORBIT = 16;

/** Apply equal-and-opposite gravitational forces (Newton III). */
function applyMutualGravity(a: Ball, b: Ball, G: number, minDist = 5) {
  const forceOnB = attract(a, b, G, minDist);
  b.applyForce(forceOnB);
  a.applyForce(forceOnB.copy().multiply(-1));
}

/** Sun ↔ Earth ↔ Moon — mutual attraction; heavier bodies barely accelerate. */
export function SolarSystem({ className }: { className?: string }) {
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

    const sun = new Ball(0, 0, SUN_RADIUS, SUN_MASS);
    const earth = new Ball(0, 0, EARTH_RADIUS, EARTH_MASS);
    const moon = new Ball(0, 0, MOON_RADIUS, MOON_MASS);
    const bodies = [sun, earth, moon];

    const earthTrail: { x: number; y: number }[] = [];
    const moonTrail: { x: number; y: number }[] = [];
    const TRAIL_MAX = 180;

    const layout = () => {
      const cx = width * 0.5;
      const cy = height * 0.5;

      // Sun–Earth separation ≫ Earth–Moon so solar gravity is nearly uniform
      // across the Earth–Moon pair (Moon stays bound to Earth).
      const separation = Math.min(width, height) * 0.42;
      const sunEarthMass = SUN_MASS + EARTH_MASS;
      const sunFromCom = (separation * EARTH_MASS) / sunEarthMass;
      const earthFromCom = (separation * SUN_MASS) / sunEarthMass;
      const vRel = Math.sqrt((G * sunEarthMass) / separation);
      const sunSpeed = (vRel * EARTH_MASS) / sunEarthMass;
      const earthSpeed = (vRel * SUN_MASS) / sunEarthMass;

      sun.position.set(cx - sunFromCom, cy);
      sun.velocity.set(0, sunSpeed);
      sun.acceleration.set(0, 0);

      earth.position.set(cx + earthFromCom, cy);
      earth.velocity.set(0, -earthSpeed);
      earth.acceleration.set(0, 0);

      // Moon orbits Earth around their shared COM (Earth barely shifts).
      const earthMoonMass = EARTH_MASS + MOON_MASS;
      const earthFromEm = (MOON_ORBIT * MOON_MASS) / earthMoonMass;
      const vMoonRel = Math.sqrt((G * earthMoonMass) / MOON_ORBIT);
      const moonSpeed = (vMoonRel * EARTH_MASS) / earthMoonMass;
      const earthKick = (vMoonRel * MOON_MASS) / earthMoonMass;

      const vComX = earth.velocity.x;
      const vComY = earth.velocity.y;
      earth.position.x -= earthFromEm;
      moon.position.set(earth.position.x + MOON_ORBIT, earth.position.y);
      earth.velocity.set(vComX, vComY + earthKick);
      moon.velocity.set(vComX, vComY - moonSpeed);
      moon.acceleration.set(0, 0);

      earthTrail.length = 0;
      moonTrail.length = 0;
    };

    /** Keep the system's center of mass fixed at the canvas center. */
    const recenterOnCom = () => {
      const cx = width * 0.5;
      const cy = height * 0.5;
      let mass = 0;
      let mx = 0;
      let my = 0;
      let mvx = 0;
      let mvy = 0;
      for (const body of bodies) {
        mass += body.mass;
        mx += body.position.x * body.mass;
        my += body.position.y * body.mass;
        mvx += body.velocity.x * body.mass;
        mvy += body.velocity.y * body.mass;
      }
      const comX = mx / mass;
      const comY = my / mass;
      const cvx = mvx / mass;
      const cvy = mvy / mass;
      const dx = cx - comX;
      const dy = cy - comY;
      for (const body of bodies) {
        body.position.x += dx;
        body.position.y += dy;
        body.velocity.x -= cvx;
        body.velocity.y -= cvy;
      }
      for (const p of earthTrail) {
        p.x += dx;
        p.y += dy;
      }
      for (const p of moonTrail) {
        p.x += dx;
        p.y += dy;
      }
    };

    const pushTrail = (trail: { x: number; y: number }[], ball: Ball) => {
      trail.push({ x: ball.position.x, y: ball.position.y });
      if (trail.length > TRAIL_MAX) trail.shift();
    };

    const drawTrail = (trail: { x: number; y: number }[], stroke: string) => {
      if (trail.length < 2) return;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      for (let i = 1; i < trail.length; i++) {
        ctx.globalAlpha = i / trail.length;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const drawLabeledBody = (ball: Ball, label: string, fill: string) => {
      ball.draw(ctx, fill, color);
      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(
        `${label}  m=${ball.mass}`,
        ball.position.x,
        ball.position.y + ball.radius + 6,
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
      ctx.fillText("F = G · m1 · m2 / d²  ·  equal & opposite on both", 12, 12);
      ctx.fillText(
        "Sun ≫ Earth ≫ Moon  →  heavier body barely accelerates",
        12,
        28,
      );

      drawTrail(earthTrail, muted);
      drawTrail(moonTrail, primary);

      drawLabeledBody(sun, "Sun", "#f0c14b");
      drawLabeledBody(earth, "Earth", primary);
      drawLabeledBody(moon, "Moon", muted);
    };

    const update = () => {
      sun.acceleration.set(0, 0);
      earth.acceleration.set(0, 0);
      moon.acceleration.set(0, 0);

      // Mutual pairs — same |F|, opposite direction; a = F/m so mass dominates.
      applyMutualGravity(sun, earth, G, 20);
      applyMutualGravity(earth, moon, G, 8);
      applyMutualGravity(sun, moon, G, 20);

      sun.update();
      earth.update();
      moon.update();

      recenterOnCom();

      pushTrail(earthTrail, earth);
      pushTrail(moonTrail, moon);
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
        // Keep sun centered on resize; re-layout for stable orbits.
        layout();
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
          Attraction · solar system
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
                  ? "Stop solar system sketch"
                  : "Play solar system sketch"
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
              aria-label="Reset solar system sketch"
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
          aria-label="Sun attracting Earth, Earth attracting Moon — gravitational orbits"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const REPEL_G = 40;
const REPEL_COUNT = 28;
const REPEL_RADIUS = 8;
const REPEL_DRAG = 0.02;
const REPEL_MIN_DIST = 12;
const REPEL_MAX_DIST = 160;

/** Many movers pushed away from the pointer — gravity with the sign flipped. */
export function Repulsion({ className }: { className?: string }) {
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
    let pointerInside = false;
    const pointer = new Vector2D(0, 0);
    const balls: Ball[] = [];

    const layout = () => {
      balls.length = 0;
      const cols = Math.ceil(Math.sqrt(REPEL_COUNT));
      const rows = Math.ceil(REPEL_COUNT / cols);
      const padX = width / (cols + 1);
      const padY = height / (rows + 1);
      for (let i = 0; i < REPEL_COUNT; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const jitterX = (Math.random() - 0.5) * padX * 0.35;
        const jitterY = (Math.random() - 0.5) * padY * 0.35;
        const ball = new Ball(
          padX * (col + 1) + jitterX,
          padY * (row + 1) + jitterY,
          REPEL_RADIUS,
          1,
        );
        balls.push(ball);
      }
      pointer.set(width * 0.5, height * 0.5);
      pointerInside = false;
    };

    const repelFromPointer = (ball: Ball) => {
      // Away from the cursor: ball − pointer (opposite of attraction).
      const force = ball.position.copy().subtract(pointer);
      let distance = force.magnitude();
      distance = Math.min(Math.max(distance, REPEL_MIN_DIST), REPEL_MAX_DIST);
      const strength = (REPEL_G * ball.mass) / (distance * distance);
      force.normalize().multiply(strength);
      ball.applyForce(force);
    };

    const applyDrag = (ball: Ball) => {
      const speed = ball.velocity.magnitude();
      if (speed < 0.001) return;
      const drag = ball.velocity.copy();
      drag
        .multiply(-1)
        .normalize()
        .multiply(speed * speed * REPEL_DRAG);
      ball.applyForce(drag);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("repulsion = −G · m / d²  ·  move pointer to push", 12, 12);

      if (pointerInside) {
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = primary;
        ctx.fill();
      }

      for (const ball of balls) {
        ball.draw(ctx, primary, color);
      }
    };

    const update = () => {
      for (const ball of balls) {
        ball.acceleration.set(0, 0);
        if (pointerInside) repelFromPointer(ball);
        applyDrag(ball);
        ball.update(4);
        ball.bounce(width, height, 0.85);
      }
    };

    const reset = () => {
      layout();
      draw();
    };

    resetRef.current = reset;

    const readPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(event.clientX - rect.left, event.clientY - rect.top);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerInside = true;
      readPointer(event);
    };
    const onPointerEnter = (event: PointerEvent) => {
      pointerInside = true;
      readPointer(event);
    };
    const onPointerLeave = () => {
      pointerInside = false;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerenter", onPointerEnter);
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
        layout();
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
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointerleave", onPointerLeave);
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
          Repulsion · cursor
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={
                playing ? "Stop repulsion sketch" : "Play repulsion sketch"
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
              aria-label="Reset repulsion sketch"
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
            aria-label="Floating balls repelled by the mouse cursor"
            className="h-full w-full cursor-none"
            style={CANVAS_STYLE}
          />
        </div>
      </PointerEventHandler>
    </div>
  );
}

const ARROW_COUNT = 48;
const ARROW_SPEED = 2.2;
const ARROW_SIZE = 7;
const PREDATOR_COUNT = 5;
const PREDATOR_SIZE = 11;
const PREDATOR_G = 85;
const PREDATOR_MAX_SPEED = 3.4;
const PREDATOR_REPEL_G = 24;
const CATCH_RADIUS = 12;
const RESPAWN_CLEARANCE = 80;
const ATTRACT_G = 10;
const CURSOR_REPEL_G = 56;
const FORCE_MIN_DIST = 16;
const FORCE_MAX_DIST = 220;
const ATTRACTOR_RADIUS = 16;
const CROWD_RADIUS = 42;
const CROWD_THRESHOLD = 5;
const FRICTION = 0.015;

type Attractor = {
  position: Vector2D;
  mass: number;
  nearby: number;
};

function wrapPosition(position: Vector2D, width: number, height: number) {
  if (position.x > width) position.x = 0;
  else if (position.x < 0) position.x = width;
  if (position.y > height) position.y = 0;
  else if (position.y < 0) position.y = height;
}

function drawArrowMover(
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  fill: string,
  stroke: string,
  size = ARROW_SIZE,
) {
  const angle = Math.atan2(ball.velocity.y, ball.velocity.x);
  ctx.save();
  ctx.translate(ball.position.x, ball.position.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.75, size * 0.65);
  ctx.lineTo(-size * 0.35, 0);
  ctx.lineTo(-size * 0.75, -size * 0.65);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/**
 * Wrapping arrows stream rightward. Click places attractors; the cursor repels.
 * Five predators chase the nearest arrows, which flee from them; caught arrows respawn. Attractors dissolve once enough arrows crowd nearby.
 */
export function ArrowAttractors({ className }: { className?: string }) {
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
    let secondary = "#1255cb";
    let raf = 0;
    let running = true;
    let visible = false;
    let pointerInside = false;
    const pointer = new Vector2D(0, 0);
    const arrows: Ball[] = [];
    const predators: Ball[] = [];
    const attractors: Attractor[] = [];

    const layout = () => {
      arrows.length = 0;
      predators.length = 0;
      attractors.length = 0;
      for (let i = 0; i < ARROW_COUNT; i++) {
        const ball = new Ball(
          Math.random() * width,
          Math.random() * height,
          ARROW_SIZE,
          1,
        );
        ball.velocity.set(ARROW_SPEED, (Math.random() - 0.5) * 0.4);
        arrows.push(ball);
      }
      for (let i = 0; i < PREDATOR_COUNT; i++) {
        const predator = new Ball(
          Math.random() * width,
          Math.random() * height,
          PREDATOR_SIZE,
          2,
        );
        predator.velocity.set(
          (Math.random() - 0.5) * ARROW_SPEED,
          (Math.random() - 0.5) * ARROW_SPEED,
        );
        predators.push(predator);
      }
      pointer.set(width * 0.5, height * 0.5);
      pointerInside = false;
    };

    const nearestArrow = (from: Vector2D) => {
      let best: Ball | null = null;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const arrow of arrows) {
        const dist = Vector2D.sub(arrow.position, from).magnitude();
        if (dist < bestDist) {
          bestDist = dist;
          best = arrow;
        }
      }
      return best;
    };

    const respawnArrow = (arrow: Ball) => {
      for (let attempt = 0; attempt < 10; attempt++) {
        arrow.position.set(Math.random() * width, Math.random() * height);
        const clear = predators.every(
          (predator) =>
            Vector2D.sub(predator.position, arrow.position).magnitude() >
            RESPAWN_CLEARANCE,
        );
        if (clear) break;
      }
      arrow.velocity.set(ARROW_SPEED, (Math.random() - 0.5) * 0.4);
      arrow.acceleration.set(0, 0);
    };

    const forceToward = (
      from: Vector2D,
      to: Vector2D,
      strengthScale: number,
    ) => {
      const force = to.copy().subtract(from);
      let distance = force.magnitude();
      distance = Math.min(Math.max(distance, FORCE_MIN_DIST), FORCE_MAX_DIST);
      const strength = strengthScale / (distance * distance);
      force.normalize().multiply(strength);
      return force;
    };

    const applyFriction = (ball: Ball) => {
      const speed = ball.velocity.magnitude();
      if (speed < 0.001) return;
      const drag = ball.velocity.copy();
      drag
        .multiply(-1)
        .normalize()
        .multiply(speed * speed * FRICTION);
      ball.applyForce(drag);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      ctx.fillStyle = muted;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("click = add attractor  ·  cursor = repel prey", 12, 12);
      ctx.fillText(
        `predators chase prey  ·  prey runs away from predators`,
        12,
        28,
      );

      for (const attractor of attractors) {
        const heat = Math.min(1, attractor.nearby / CROWD_THRESHOLD);
        ctx.beginPath();
        ctx.arc(
          attractor.position.x,
          attractor.position.y,
          ATTRACTOR_RADIUS,
          0,
          Math.PI * 2,
        );
        ctx.globalAlpha = 0.35 + heat * 0.55;
        ctx.fillStyle = secondary;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (attractor.nearby > 0) {
          ctx.beginPath();
          ctx.arc(
            attractor.position.x,
            attractor.position.y,
            CROWD_RADIUS,
            0,
            Math.PI * 2,
          );
          ctx.globalAlpha = 0.2 + heat * 0.5;
          ctx.strokeStyle = secondary;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
      }

      if (pointerInside) {
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 16, 0, Math.PI * 2);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = primary;
        ctx.fill();
      }

      for (const arrow of arrows) {
        drawArrowMover(ctx, arrow, primary, color);
      }
      for (const predator of predators) {
        drawArrowMover(ctx, predator, secondary, color, PREDATOR_SIZE);
      }
    };

    const update = () => {
      for (const attractor of attractors) {
        attractor.nearby = 0;
      }

      for (const arrow of arrows) {
        arrow.acceleration.set(0, 0);

        for (const attractor of attractors) {
          const pull = forceToward(
            arrow.position,
            attractor.position,
            ATTRACT_G * attractor.mass,
          );
          arrow.applyForce(pull);

          if (
            Vector2D.sub(arrow.position, attractor.position).magnitude() <
            CROWD_RADIUS
          ) {
            attractor.nearby += 1;
          }
        }

        if (pointerInside) {
          const push = forceToward(
            arrow.position,
            pointer,
            CURSOR_REPEL_G,
          ).multiply(-1);
          arrow.applyForce(push);
        }

        for (const predator of predators) {
          const flee = forceToward(
            arrow.position,
            predator.position,
            PREDATOR_REPEL_G * predator.mass,
          ).multiply(-1);
          arrow.applyForce(flee);
        }

        applyFriction(arrow);
        arrow.update(5);
        wrapPosition(arrow.position, width, height);
      }

      for (const predator of predators) {
        predator.acceleration.set(0, 0);
        const prey = nearestArrow(predator.position);
        if (prey) {
          const chase = forceToward(
            predator.position,
            prey.position,
            PREDATOR_G * prey.mass,
          );
          predator.applyForce(chase);
        }
        applyFriction(predator);
        predator.update(PREDATOR_MAX_SPEED);
        wrapPosition(predator.position, width, height);

        for (const arrow of arrows) {
          if (
            Vector2D.sub(arrow.position, predator.position).magnitude() <
            CATCH_RADIUS
          ) {
            respawnArrow(arrow);
          }
        }
      }

      for (let i = attractors.length - 1; i >= 0; i--) {
        if (attractors[i].nearby >= CROWD_THRESHOLD) {
          attractors.splice(i, 1);
        }
      }
    };

    const reset = () => {
      layout();
      draw();
    };

    resetRef.current = reset;

    const readPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(event.clientX - rect.left, event.clientY - rect.top);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerInside = true;
      readPointer(event);
    };
    const onPointerEnter = (event: PointerEvent) => {
      pointerInside = true;
      readPointer(event);
    };
    const onPointerLeave = () => {
      pointerInside = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      readPointer(event);
      pointerInside = true;
      attractors.push({
        position: pointer.copy(),
        mass: 8,
        nearby: 0,
      });
      if (!playingRef.current) draw();
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerenter", onPointerEnter);
    canvas.addEventListener("pointerleave", onPointerLeave);
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
      secondary = styles.getPropertyValue("--secondary").trim() || secondary;
      if (first) {
        reset();
      } else {
        layout();
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
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
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
          Attract + Repel · arrows
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
                  ? "Stop arrow attractors sketch"
                  : "Play arrow attractors sketch"
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
              aria-label="Reset arrow attractors sketch"
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
            aria-label="Arrows wrapping across the canvas, attracted by clicks and repelled by the cursor"
            className="h-full w-full cursor-none"
            style={CANVAS_STYLE}
          />
        </div>
      </PointerEventHandler>
    </div>
  );
}
