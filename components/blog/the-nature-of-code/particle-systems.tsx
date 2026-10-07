"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Vector2D } from "@/components/blog/the-nature-of-code/vectors";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CVSubHeading } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";

const PARTICLE_RADIUS = 5;
const PARTICLE_LIFETIME = 255;
const PARTICLE_RESPAWN_FRAMES = 40;

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

/** Matches the Particle class in the particle systems post. */
export class ParticleBody {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  lifetime: number;
  maxLifetime: number;

  constructor(x: number, y: number, lifetime = PARTICLE_LIFETIME) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.acceleration = new Vector2D(0, 0);
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
  }

  applyForce(force: Vector2D) {
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    // Forces are re-applied every frame, so they must not pile up.
    this.acceleration.set(0, 0);
    this.lifetime--;
  }

  show(ctx: CanvasRenderingContext2D, fill: string, stroke: string) {
    ctx.save();
    ctx.globalAlpha = Math.max(this.lifetime, 0) / PARTICLE_LIFETIME;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, PARTICLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  /** Matches the coloured show() in the particle systems post: hue and size follow the lifetime. */
  showColored(ctx: CanvasRenderingContext2D) {
    const life = Math.max(this.lifetime, 0) / this.maxLifetime;
    ctx.save();
    ctx.globalAlpha = life * 0.8;
    ctx.fillStyle = `hsl(${55 * life}, 100%, ${45 + 15 * life}%)`;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, life * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.lifetime < 0;
  }
}

/** A particle drifting in a random direction, slow enough to stay on the canvas for its whole lifetime. */
function createDriftingParticle(
  x: number,
  y: number,
  width: number,
  height: number,
  lifetime = PARTICLE_LIFETIME,
) {
  const particle = new ParticleBody(x, y, lifetime);
  const speed = (Math.min(width, height) * 0.35) / PARTICLE_LIFETIME;
  const angle = Math.random() * Math.PI * 2;
  particle.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
  return particle;
}

/** A single particle that drifts, fades with its lifetime, and is removed once it is dead. */
export function Particle({ className }: { className?: string }) {
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
    let raf = 0;
    let running = true;
    let visible = false;
    let particle: ParticleBody | null = null;
    let deadFrames = 0;

    const spawn = (x: number, y: number) => {
      particle = createDriftingParticle(x, y, width, height);
      deadFrames = 0;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      particle?.show(ctx, primary, color);

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(
        particle
          ? `lifetime = ${Math.max(particle.lifetime, 0)}`
          : "particle = null",
        12,
        12,
      );
    };

    const update = () => {
      if (particle) {
        particle.update();
        if (particle.isDead()) particle = null;
        return;
      }
      deadFrames++;
      if (deadFrames > PARTICLE_RESPAWN_FRAMES) spawn(width / 2, height / 2);
    };

    const reset = () => {
      spawn(width / 2, height / 2);
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
          Particle
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={`${playing ? "Stop" : "Play"} particle sketch`}
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
              aria-label="Reset particle sketch"
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
          aria-label="A single particle that drifts and fades out as its lifetime runs down, then is removed"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

/** Particles stored in an array: one is added every frame, all are updated and drawn, and dead ones are filtered out. */
export function ParticlesInArray({ className }: { className?: string }) {
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
    let raf = 0;
    let running = true;
    let visible = false;
    let particles: ParticleBody[] = [];

    const addParticle = (x: number, y: number) => {
      particles.push(createDriftingParticle(x, y, width, height));
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      for (const particle of particles) {
        particle.show(ctx, primary, color);
      }

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(`particles.length = ${particles.length}`, 12, 12);
    };

    const update = () => {
      addParticle(width / 2, height / 2);

      for (const particle of particles) {
        particle.update();
      }
      particles = particles.filter((particle) => !particle.isDead());
    };

    const reset = () => {
      particles = [];
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
          Particles in an array
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={`${playing ? "Stop" : "Play"} particles in an array sketch`}
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
              aria-label="Reset particles in an array sketch"
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
          aria-label="A stream of particles added every frame, drifting and fading out, removed from the array once dead"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

/** Matches the ParticleSystem class in the particle systems post. */
export class ParticleSystemBody {
  particles: ParticleBody[] = [];

  // Creating a new particle; the canvas size keeps its drift on screen.
  addParticle(
    x: number,
    y: number,
    width: number,
    height: number,
    lifetime = PARTICLE_LIFETIME,
  ) {
    const particle = createDriftingParticle(x, y, width, height, lifetime);
    this.particles.push(particle);
    return particle;
  }

  // Updating the particles, then removing the dead ones
  update() {
    for (const particle of this.particles) {
      particle.update();
    }
    this.particles = this.particles.filter((particle) => !particle.isDead());
  }

  // Drawing the particles
  show(ctx: CanvasRenderingContext2D, fill: string, stroke: string) {
    for (const particle of this.particles) {
      particle.show(ctx, fill, stroke);
    }
  }

  showColored(ctx: CanvasRenderingContext2D) {
    for (const particle of this.particles) {
      particle.showColored(ctx);
    }
  }
}

/** A ParticleSystem that adds a particle at the center every frame, then updates and draws them all. */
export function ParticleSystem({ className }: { className?: string }) {
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
    let raf = 0;
    let running = true;
    let visible = false;
    let particleSystem = new ParticleSystemBody();

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      particleSystem.show(ctx, primary, color);

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(
        `particleSystem.particles.length = ${particleSystem.particles.length}`,
        12,
        12,
      );
    };

    const update = () => {
      particleSystem.addParticle(width / 2, height / 2, width, height);
      particleSystem.update();
    };

    const reset = () => {
      particleSystem = new ParticleSystemBody();
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
          Particle system
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={`${playing ? "Stop" : "Play"} particle system sketch`}
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
              aria-label="Reset particle system sketch"
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
          aria-label="A particle system emitting a stream of fading particles from the center"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const PARTICLE_SYSTEM_MAX = 6;

/** Matches the ParticleSystem class with an origin in the particle systems post. */
export class OriginParticleSystemBody {
  particles: ParticleBody[] = [];
  origin: Vector2D;

  constructor(x: number, y: number) {
    this.origin = new Vector2D(x, y);
  }

  addParticle(width: number, height: number) {
    this.particles.push(
      createDriftingParticle(this.origin.x, this.origin.y, width, height),
    );
  }

  update() {
    for (const particle of this.particles) {
      particle.update();
    }
    this.particles = this.particles.filter((particle) => !particle.isDead());
  }

  show(ctx: CanvasRenderingContext2D, fill: string, stroke: string) {
    for (const particle of this.particles) {
      particle.show(ctx, fill, stroke);
    }
  }
}

/** Particle systems that each emit from their own origin; click to add another system. */
export function ParticleSystemWithOrigin({
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
    let particleSystems: OriginParticleSystemBody[] = [];

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      for (const particleSystem of particleSystems) {
        particleSystem.show(ctx, primary, color);
      }

      // Each system's origin
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (const { origin } of particleSystems) {
        ctx.beginPath();
        ctx.moveTo(origin.x - 5, origin.y);
        ctx.lineTo(origin.x + 5, origin.y);
        ctx.moveTo(origin.x, origin.y - 5);
        ctx.lineTo(origin.x, origin.y + 5);
        ctx.stroke();
      }

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(
        `particleSystems.length = ${particleSystems.length}`,
        12,
        12,
      );
      ctx.fillStyle = muted;
      ctx.textBaseline = "bottom";
      ctx.fillText("click to add a particle system", 12, height - 10);
    };

    const update = () => {
      for (const particleSystem of particleSystems) {
        particleSystem.addParticle(width, height);
        particleSystem.update();
      }
    };

    const reset = () => {
      particleSystems = [new OriginParticleSystemBody(width / 2, height / 2)];
      draw();
    };

    resetRef.current = reset;

    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      particleSystems.push(
        new OriginParticleSystemBody(
          event.clientX - rect.left,
          event.clientY - rect.top,
        ),
      );
      if (particleSystems.length > PARTICLE_SYSTEM_MAX) particleSystems.shift();
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
          Particle systems with origins
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={`${playing ? "Stop" : "Play"} particle systems with origins sketch`}
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
              aria-label="Reset particle systems with origins sketch"
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
          aria-label="Particle systems that each emit a stream of fading particles from their own origin"
          className="h-full w-full cursor-crosshair"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const FIRE_WIND_MAX = 0.03;

/** Click to light ShootingUpFromTheBottom-style particle systems, with wind from the pointer's horizontal position. */
export function FireParticleSystem({ className }: { className?: string }) {
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
    let muted = "#9a9a9a";
    let raf = 0;
    let running = true;
    let visible = false;
    let fires: { origin: Vector2D; system: WindAndLiftParticleSystemBody }[] =
      [];
    let wind = 0;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      for (const fire of fires) {
        fire.system.showColored(ctx);
      }

      const particleCount = fires.reduce(
        (sum, fire) => sum + fire.system.particles.length,
        0,
      );

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(`wind = ${wind.toFixed(3)}`, 12, 12);
      ctx.fillStyle = muted;
      ctx.fillText(`fires = ${fires.length}`, 12, 28);
      ctx.fillText(`particles = ${particleCount}`, 12, 44);
      ctx.textBaseline = "bottom";
      ctx.fillText("click to light a fire", 12, height - 10);
    };

    const update = () => {
      const speed = (Math.min(width, height) * 0.35) / PARTICLE_LIFETIME;
      const scale = speed / POST_PARTICLE_SPEED;
      for (const { origin, system } of fires) {
        system.wind.set(wind * scale, 0);
        system.lift.set(0, LIFT_DEFAULT * scale);
        const particle = system.addParticle(
          origin.x,
          origin.y,
          width,
          height,
          COLORED_PARTICLE_LIFETIME,
        );
        particle.velocity.set(
          (Math.random() - 0.5) * 2 * scale, // -1 to 1, sideways
          -Math.random() * 2 * scale, // -2 to 0, upwards
        );
        system.update();
      }
    };

    const reset = () => {
      fires = [];
      wind = 0;
      draw();
    };

    resetRef.current = reset;

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(rect.width, 1);
      wind = (x - 0.5) * 2 * FIRE_WIND_MAX;
    };
    const onPointerDown = (event: PointerEvent) => {
      onPointerMove(event);
      const rect = canvas.getBoundingClientRect();
      fires.push({
        origin: new Vector2D(
          event.clientX - rect.left,
          event.clientY - rect.top,
        ),
        system: new WindAndLiftParticleSystemBody(),
      });
      if (fires.length > PARTICLE_SYSTEM_MAX) fires.shift();
      draw();
    };
    const onPointerLeave = () => {
      wind = 0;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
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
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
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
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
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
          Fire
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={`${playing ? "Stop" : "Play"} fire sketch`}
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
              aria-label="Reset fire sketch"
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
          aria-label="Click to light fires made of rising particles that cool from yellow to red, bent by wind from the pointer"
          className="h-full w-full cursor-crosshair"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const WIND_DEFAULT = 0.01;
const LIFT_DEFAULT = -0.05;
const COLORED_PARTICLE_LIFETIME = 64;
/** The post's particles drift at 0.3px per frame; forces are scaled by the same ratio as the sketch's drift speed. */
const POST_PARTICLE_SPEED = 0.3;

/** Matches the ParticleSystem with wind and lift in the particle systems post. */
export class WindAndLiftParticleSystemBody extends ParticleSystemBody {
  wind = new Vector2D(WIND_DEFAULT, 0);
  lift = new Vector2D(0, LIFT_DEFAULT);

  update() {
    for (const particle of this.particles) {
      particle.applyForce(this.wind);
      particle.applyForce(this.lift);
    }
    super.update();
  }
}

/** A particle system that pushes every particle with a constant wind and an upward lift. */
export function WindAndLift({ className }: { className?: string }) {
  return <WindAndLiftSketch className={className} title="Wind and lift" />;
}

/** The wind and lift sketch, with each particle coloured and sized by its lifetime like a flame. */
export function ColorsAndShapes({ className }: { className?: string }) {
  return (
    <WindAndLiftSketch
      className={className}
      title="Colors and shapes"
      colored
    />
  );
}

/** The flame sketch with particles launched upwards from the origin with a random sideways spread. */
export function ShootingUpFromTheBottom({ className }: { className?: string }) {
  return (
    <WindAndLiftSketch
      className={className}
      title="Shooting up from the bottom"
      colored
      shootUp
    />
  );
}

function WindAndLiftSketch({
  className,
  title,
  colored = false,
  shootUp = false,
}: {
  className?: string;
  title: string;
  colored?: boolean;
  shootUp?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef(() => {});
  const playingRef = useRef(true);
  const forcesRef = useRef({ wind: WIND_DEFAULT, lift: LIFT_DEFAULT });
  const [playing, setPlaying] = useState(true);
  const [forces, setForces] = useState(forcesRef.current);
  playingRef.current = playing;
  forcesRef.current = forces;

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
    let particleSystem = new WindAndLiftParticleSystemBody();

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      if (colored) particleSystem.showColored(ctx);
      else particleSystem.show(ctx, primary, color);

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const { wind, lift } = forcesRef.current;
      ctx.fillStyle = color;
      ctx.fillText(`wind = (${wind.toFixed(3)}, 0)`, 12, 12);
      ctx.fillStyle = muted;
      ctx.fillText(`lift = (0, ${lift.toFixed(3)})`, 12, 28);
    };

    const update = () => {
      const { wind, lift } = forcesRef.current;
      const speed = (Math.min(width, height) * 0.35) / PARTICLE_LIFETIME;
      const scale = speed / POST_PARTICLE_SPEED;
      particleSystem.wind.set(wind * scale, 0);
      particleSystem.lift.set(0, lift * scale);
      const particle = particleSystem.addParticle(
        width / 2,
        height * 0.85,
        width,
        height,
        colored ? COLORED_PARTICLE_LIFETIME : PARTICLE_LIFETIME,
      );
      if (shootUp) {
        particle.velocity.set(
          (Math.random() - 0.5) * 2 * scale, // -1 to 1, sideways
          -Math.random() * 2 * scale, // -2 to 0, upwards
        );
      }
      particleSystem.update();
    };

    const reset = () => {
      particleSystem = new WindAndLiftParticleSystemBody();
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
  }, [colored, shootUp]);

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
              onClick={() => {
                setForces({ wind: WIND_DEFAULT, lift: LIFT_DEFAULT });
                resetRef.current();
              }}
            >
              <RotateCcw />
            </Button>
          </PointerEventHandler>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-b border-border px-3 py-2 font-mono text-xs text-muted-foreground">
        {(
          [
            { key: "wind", label: "wind.x", min: -0.03, max: 0.03 },
            { key: "lift", label: "lift.y", min: -0.1, max: 0 },
          ] as const
        ).map(({ key, label, min, max }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-20">{label}</span>
            <Slider
              className="flex-1"
              min={min}
              max={max}
              step={0.001}
              value={[forces[key]]}
              aria-label={label}
              onValueChange={([value]) =>
                setForces((current) => ({ ...current, [key]: value }))
              }
            />
            <span className="w-12 text-right text-foreground">
              {forces[key].toFixed(3)}
            </span>
          </div>
        ))}
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label={`Particles drifting out from near the bottom, pushed sideways by wind and upwards by lift${colored ? ", cooling from yellow to red as they age" : ""}`}
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const CONFETTI_SIZE = 10;
const CONFETTI_WIND_RANGE = 0.01;
const CONFETTI_GRAVITY = 0.01;
/** Frames at the end of a confetti's life spent fading out, so it doesn't pop out of existence. */
const CONFETTI_FADE_FRAMES = 40;

/** Matches the ConfettiParticle class in the polymorphism post: a particle that spins as it moves. */
export class ConfettiParticle extends ParticleBody {
  angle = Math.random() * 2 * Math.PI;
  angularVelocity = Math.random() * 0.1 - 0.05;
  color = `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`;

  update() {
    super.update();
    this.angle += this.angularVelocity;
  }

  protected shape(ctx: CanvasRenderingContext2D) {
    ctx.rect(
      -CONFETTI_SIZE / 2,
      -CONFETTI_SIZE / 2,
      CONFETTI_SIZE,
      CONFETTI_SIZE,
    );
  }

  showConfetti(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.min(
      Math.max(this.lifetime, 0) / CONFETTI_FADE_FRAMES,
      1,
    );
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    this.shape(ctx);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

export class CircleConfettiParticle extends ConfettiParticle {
  protected shape(ctx: CanvasRenderingContext2D) {
    ctx.arc(0, 0, CONFETTI_SIZE / 2, 0, Math.PI * 2);
  }
}

export class SquareConfettiParticle extends ConfettiParticle {}

export class TriangleConfettiParticle extends ConfettiParticle {
  protected shape(ctx: CanvasRenderingContext2D) {
    const r = CONFETTI_SIZE / 2;
    ctx.moveTo(0, -r);
    ctx.lineTo(r, r);
    ctx.lineTo(-r, r);
    ctx.closePath();
  }
}

/** Matches the ConfettiSystem class in the polymorphism post: it only knows its particles are ConfettiParticles. */
export class ConfettiSystemBody {
  particles: ConfettiParticle[] = [];
  origin: Vector2D;
  /** In the post's units, before scaling to the canvas: -0.005 to 0.005. */
  windX = Math.random() * CONFETTI_WIND_RANGE - CONFETTI_WIND_RANGE / 2;
  wind = new Vector2D(this.windX, 0);
  gravity = new Vector2D(0, CONFETTI_GRAVITY);

  constructor(width: number) {
    this.origin = new Vector2D(width / 2, 0);
  }

  addParticle(particle: ConfettiParticle) {
    this.particles.push(particle);
  }

  update() {
    for (const particle of this.particles) {
      particle.applyForce(this.wind);
      particle.applyForce(this.gravity);
      particle.update();
    }
    this.particles = this.particles.filter((particle) => !particle.isDead());
  }

  show(ctx: CanvasRenderingContext2D) {
    for (const particle of this.particles) {
      particle.showConfetti(ctx);
    }
  }

  isDead() {
    return this.particles.length === 0;
  }
}

function createRandomConfettiParticle(x: number, y: number, scale: number) {
  const pick = Math.random() * 3;
  const particle =
    pick < 1
      ? new CircleConfettiParticle(x, y)
      : pick < 2
        ? new SquareConfettiParticle(x, y)
        : new TriangleConfettiParticle(x, y);
  particle.velocity.set(
    (Math.random() - 0.5) * 2 * scale, // -1 to 1, sideways
    Math.random() * scale, // 0 to 1, downwards
  );
  return particle;
}

/** One ConfettiSystem filled with circle, square and triangle confetti, all drawn through the same show() call. */
export function ConfettiSystem({ className }: { className?: string }) {
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
    let muted = "#9a9a9a";
    let raf = 0;
    let running = true;
    let visible = false;
    let confettiSystem = new ConfettiSystemBody(0);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      confettiSystem.show(ctx);

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(
        `confettiSystem.particles.length = ${confettiSystem.particles.length}`,
        12,
        12,
      );
      ctx.fillStyle = muted;
      ctx.fillText(`wind = (${confettiSystem.windX.toFixed(4)}, 0)`, 12, 28);
    };

    const update = () => {
      const speed = (Math.min(width, height) * 0.35) / PARTICLE_LIFETIME;
      const scale = speed / POST_PARTICLE_SPEED;
      confettiSystem.origin.set(width / 2, 0);
      confettiSystem.wind.set(confettiSystem.windX * scale, 0);
      confettiSystem.gravity.set(0, CONFETTI_GRAVITY * scale);
      const { origin } = confettiSystem;
      confettiSystem.addParticle(
        createRandomConfettiParticle(origin.x, origin.y, scale),
      );
      confettiSystem.update();
    };

    const reset = () => {
      confettiSystem = new ConfettiSystemBody(width);
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
          Confetti system
        </CVSubHeading>
        <div className="flex items-center gap-2">
          <PointerEventHandler asChild type="hide">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              aria-label={`${playing ? "Stop" : "Play"} confetti system sketch`}
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
              aria-label="Reset confetti system sketch"
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
          aria-label="Spinning circle, square and triangle confetti bursting from the top center and falling with gravity and a light random wind"
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}
