"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Vector2D } from "@/components/blog/the-nature-of-code/vectors";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { CVSubHeading } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";

const VEHICLE_SPEED = 4;
const VEHICLE_MAX_SPEED = 5;
const VEHICLE_MAX_FORCE = 0.1;
const VEHICLE_SIZE = 6;
const TARGET_RADIUS = 6;

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

/** Matches the Vehicle class in the autonomous agents post. */
export class VehicleBody {
  position: Vector2D;
  velocity = new Vector2D(0, 0);
  acceleration = new Vector2D(0, 0);
  /** The desired speed of the vehicle towards the target. */
  speed = VEHICLE_SPEED;
  maxSpeed = VEHICLE_MAX_SPEED;
  maxForce = VEHICLE_MAX_FORCE;
  size = VEHICLE_SIZE;

  constructor(x: number, y: number) {
    this.position = new Vector2D(x, y);
  }

  applyForce(force: Vector2D) {
    this.acceleration.add(force);
  }

  desiredVelocity(target: Vector2D) {
    const desired = Vector2D.sub(target, this.position);
    desired.normalize();
    desired.multiply(this.speed);
    return desired;
  }

  seek(target: Vector2D) {
    // Steering: F_steer = v_desired - v_current
    const desired = this.desiredVelocity(target);

    const steer = Vector2D.sub(desired, this.velocity);
    steer.limit(this.maxForce);

    this.applyForce(steer);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.set(0, 0);
  }

  /** Wraps around the edges; returns true when the vehicle jumped to the other side. */
  edges(width: number, height: number) {
    const { x, y } = this.position;
    if (this.position.x < 0) this.position.x = width;
    if (this.position.x > width) this.position.x = 0;
    if (this.position.y < 0) this.position.y = height;
    if (this.position.y > height) this.position.y = 0;
    return x !== this.position.x || y !== this.position.y;
  }

  show(ctx: CanvasRenderingContext2D, fill: string) {
    const angle = Math.atan2(this.velocity.y, this.velocity.x);

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(this.size * 2, 0);
    ctx.lineTo(-this.size * 2, -this.size);
    ctx.lineTo(-this.size * 2, this.size);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }
}

/** Within this distance of the target the arriving vehicle starts to slow down. */
const DISTANCE_OF_INTEREST = 100;

/** Matches the arriving seek in the autonomous agents post: full speed when far, slowing down within the distance of interest. */
export class ArrivingVehicleBody extends VehicleBody {
  desiredVelocity(target: Vector2D) {
    const desired = Vector2D.sub(target, this.position);
    const distance = desired.magnitude();

    desired.normalize();

    if (distance < DISTANCE_OF_INTEREST) {
      const factor = distance / DISTANCE_OF_INTEREST;
      desired.multiply(this.maxSpeed * factor);
    } else {
      desired.multiply(this.maxSpeed);
    }
    return desired;
  }
}

/** A single vehicle seeking a target that follows the pointer and returns to the center when the pointer leaves. */
export function VehicleSimple({ className }: { className?: string }) {
  return <VehicleSketch className={className} title="Vehicle" />;
}

/** The vehicle sketch with the arriving seek: fast when far from the target, slowing down as it gets close. */
export function VehicleArriving({ className }: { className?: string }) {
  return (
    <VehicleSketch className={className} title="Arriving vehicle" arriving />
  );
}

function VehicleSketch({
  className,
  title,
  arriving = false,
}: {
  className?: string;
  title: string;
  arriving?: boolean;
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
    const createVehicle = (x: number, y: number) =>
      arriving ? new ArrivingVehicleBody(x, y) : new VehicleBody(x, y);
    let vehicle = createVehicle(0, 0);
    const target = new Vector2D(0, 0);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Inside this circle the arriving vehicle slows down
      if (arriving) {
        ctx.beginPath();
        ctx.arc(target.x, target.y, DISTANCE_OF_INTEREST, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Desired velocity, from the vehicle towards the target
      const desired = vehicle.desiredVelocity(target);
      desired.multiply(8);
      ctx.beginPath();
      ctx.moveTo(vehicle.position.x, vehicle.position.y);
      ctx.lineTo(
        vehicle.position.x + desired.x,
        vehicle.position.y + desired.y,
      );
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(target.x, target.y, TARGET_RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      vehicle.show(ctx, primary);

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(
        `|velocity| = ${vehicle.velocity.magnitude().toFixed(2)}`,
        12,
        12,
      );
      ctx.fillStyle = muted;
      ctx.fillText(
        arriving
          ? `maxSpeed = ${vehicle.maxSpeed}`
          : `speed = ${vehicle.speed}, maxSpeed = ${vehicle.maxSpeed}`,
        12,
        28,
      );
      ctx.fillText(`maxForce = ${vehicle.maxForce}`, 12, 44);
      ctx.textBaseline = "bottom";
      ctx.fillText("move the pointer to set the target", 12, height - 10);
    };

    const update = () => {
      vehicle.seek(target);
      vehicle.update();
    };

    const reset = () => {
      vehicle = createVehicle(width * 0.15, height * 0.8);
      target.set(width / 2, height / 2);
      draw();
    };

    resetRef.current = reset;

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.set(event.clientX - rect.left, event.clientY - rect.top);
    };
    const onPointerLeave = () => {
      target.set(width / 2, height / 2);
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerMove);
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
      canvas.removeEventListener("pointerdown", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, [arriving]);

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
          aria-label={`A triangular vehicle steering towards a target, turning gradually because its steering force is limited${arriving ? ", slowing down as it arrives" : ""}`}
          className="h-full w-full cursor-crosshair"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}

const WANDER_RADIUS = 25;
const WANDER_STEP = (2 * Math.PI) / 10;
const MINIMUM_WANDER_DISTANCE = 25;
const WANDER_TRAIL_LENGTH = 240;

/** Matches the wandering Vehicles in the autonomous agents post: seeks a point on a circle centred on its next frame's location. */
export class WanderingVehicleBody extends VehicleBody {
  wanderTheta = 0;
  wanderRadius = WANDER_RADIUS;
  /** 0 picks a fresh random angle every frame; otherwise the angle changes by a random -wanderStep / 2 to wanderStep / 2 each frame. */
  wanderStep = 0;
  /** 0 keeps the circle exactly on the next frame's location. */
  minimumWanderDistance = 0;
  circleCenter = new Vector2D(0, 0);
  wanderTarget = new Vector2D(0, 0);

  wander() {
    if (this.wanderStep > 0) {
      this.wanderTheta += Math.random() * this.wanderStep - this.wanderStep / 2;
    } else {
      this.wanderTheta = Math.random() * 2 * Math.PI;
    }

    let nextPositionDistance = this.velocity.magnitude();
    if (nextPositionDistance < this.minimumWanderDistance) {
      nextPositionDistance = this.minimumWanderDistance;
    }
    const circleCenter = this.velocity.copy();
    circleCenter.normalize();
    circleCenter.multiply(nextPositionDistance);
    circleCenter.add(this.position); // next frame's location of the vehicle

    const heading = Math.atan2(this.velocity.y, this.velocity.x);
    const target = new Vector2D(
      circleCenter.x + this.wanderRadius * Math.cos(this.wanderTheta + heading),
      circleCenter.y + this.wanderRadius * Math.sin(this.wanderTheta + heading),
    );

    this.circleCenter = circleCenter;
    this.wanderTarget = target;
    this.seek(target);
  }
}

const EDGE_SPACE = 25;

/** Matches the wall-aware wandering Vehicle in the autonomous agents post: near a wall it steers away instead of wandering. */
export class WallWanderingVehicleBody extends WanderingVehicleBody {
  edgeSpace = EDGE_SPACE;
  avoidingWall = false;

  wanderWithinWalls(width: number, height: number) {
    let desiredVelocityDueToEdge: Vector2D | null = null;
    if (this.position.x < this.edgeSpace) {
      desiredVelocityDueToEdge = new Vector2D(this.maxSpeed, this.velocity.y);
    } else if (this.position.x > width - this.edgeSpace) {
      desiredVelocityDueToEdge = new Vector2D(-this.maxSpeed, this.velocity.y);
    }
    if (this.position.y < this.edgeSpace) {
      desiredVelocityDueToEdge = new Vector2D(this.velocity.x, this.maxSpeed);
    } else if (this.position.y > height - this.edgeSpace) {
      desiredVelocityDueToEdge = new Vector2D(this.velocity.x, -this.maxSpeed);
    }

    this.avoidingWall = desiredVelocityDueToEdge !== null;
    if (desiredVelocityDueToEdge) {
      desiredVelocityDueToEdge.normalize();
      desiredVelocityDueToEdge.multiply(this.maxSpeed);
      const steer = Vector2D.sub(desiredVelocityDueToEdge, this.velocity);
      steer.limit(0.5);
      this.applyForce(steer);
      return;
    }

    this.wander();
  }
}

/** Matches the random steering Vehicle in the autonomous agents post: a brand new random steering direction every frame. */
export class RandomSteeringVehicleBody extends VehicleBody {
  steer = new Vector2D(0, 0);

  randomSteer() {
    const angle = Math.random() * 2 * Math.PI;
    const steer = new Vector2D(Math.cos(angle), Math.sin(angle));
    steer.multiply(this.maxForce);

    this.steer = steer;
    this.applyForce(steer);
  }
}

/** A vehicle wandering on its own, showing the wander circle and the point it is seeking. */
export function VehicleWandering({ className }: { className?: string }) {
  return <FreeVehicleSketch className={className} title="Wandering vehicle" />;
}

/** The wandering vehicle with a pseudo-random angle: each frame's angle is a small random change from the previous one. */
export function VehiclePsuedoRandomAhead({
  className,
}: {
  className?: string;
}) {
  return (
    <FreeVehicleSketch
      className={className}
      title="Pseudo-random wandering"
      wanderStep={WANDER_STEP}
    />
  );
}

/** The pseudo-random wandering vehicle with its wander circle kept at least a minimum distance ahead. */
export function VehicleWanderingAhead({ className }: { className?: string }) {
  return (
    <FreeVehicleSketch
      className={className}
      title="Wandering ahead"
      wanderStep={WANDER_STEP}
      minimumWanderDistance={MINIMUM_WANDER_DISTANCE}
    />
  );
}

/** The wandering ahead vehicle that turns back when it gets within edgeSpace of a wall. */
export function VehicleWanderingWithinWalls({
  className,
}: {
  className?: string;
}) {
  return (
    <FreeVehicleSketch
      className={className}
      title="Wandering within walls"
      wanderStep={WANDER_STEP}
      minimumWanderDistance={MINIMUM_WANDER_DISTANCE}
      walls
    />
  );
}

/** A vehicle steering in a completely random direction every frame, for comparison with wandering. */
export function VehicleRandomSteering({ className }: { className?: string }) {
  return (
    <FreeVehicleSketch
      className={className}
      title="Random steering vehicle"
      random
    />
  );
}

function FreeVehicleSketch({
  className,
  title,
  random = false,
  wanderStep = 0,
  minimumWanderDistance = 0,
  walls = false,
}: {
  className?: string;
  title: string;
  random?: boolean;
  wanderStep?: number;
  minimumWanderDistance?: number;
  walls?: boolean;
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
    const createVehicle = (x: number, y: number) => {
      if (random) return new RandomSteeringVehicleBody(x, y);
      const wanderer = walls
        ? new WallWanderingVehicleBody(x, y)
        : new WanderingVehicleBody(x, y);
      wanderer.wanderStep = wanderStep;
      wanderer.minimumWanderDistance = minimumWanderDistance;
      return wanderer;
    };
    let vehicle = createVehicle(0, 0);
    // Recent positions; null breaks the line where the vehicle wrapped around
    let trail: (Vector2D | null)[] = [];

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      // Trail: shows the long term order of the path
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      let drawing = false;
      for (const point of trail) {
        if (!point) {
          drawing = false;
          continue;
        }
        if (drawing) ctx.lineTo(point.x, point.y);
        else ctx.moveTo(point.x, point.y);
        drawing = true;
      }
      ctx.stroke();

      if (vehicle instanceof WallWanderingVehicleBody) {
        // Inner boundary: inside this the vehicle wanders, outside it turns back
        const { edgeSpace } = vehicle;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          edgeSpace,
          edgeSpace,
          width - edgeSpace * 2,
          height - edgeSpace * 2,
        );
        ctx.setLineDash([]);
      }

      if (vehicle instanceof WanderingVehicleBody) {
        const { position, circleCenter, wanderTarget, wanderRadius } = vehicle;

        // Line ahead to the wander circle, the circle, and the point being sought
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(circleCenter.x, circleCenter.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(circleCenter.x, circleCenter.y, wanderRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(circleCenter.x, circleCenter.y);
        ctx.lineTo(wanderTarget.x, wanderTarget.y);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(wanderTarget.x, wanderTarget.y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // This frame's steering force, scaled up so it is visible
        const { position, steer } = vehicle;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x + steer.x * 250, position.y + steer.y * 250);
        ctx.stroke();
      }

      vehicle.show(ctx, primary);

      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      if (vehicle instanceof WanderingVehicleBody) {
        ctx.fillText(`wanderTheta = ${vehicle.wanderTheta.toFixed(2)}`, 12, 12);
        ctx.fillStyle = muted;
        ctx.fillText(
          vehicle.wanderStep > 0
            ? "wanderTheta += random -π/10 to π/10"
            : "wanderTheta = random 0 to 2π",
          12,
          28,
        );
        if (vehicle.minimumWanderDistance > 0) {
          ctx.fillText(
            `minimumWanderDistance = ${vehicle.minimumWanderDistance}`,
            12,
            44,
          );
        }
        if (vehicle instanceof WallWanderingVehicleBody) {
          ctx.fillStyle = vehicle.avoidingWall ? color : muted;
          ctx.fillText(
            vehicle.avoidingWall ? "near a wall: turning back" : "wandering",
            12,
            60,
          );
        }
      } else {
        const steerAngle = Math.atan2(vehicle.steer.y, vehicle.steer.x);
        ctx.fillText(`steer angle = ${steerAngle.toFixed(2)}`, 12, 12);
        ctx.fillStyle = muted;
        ctx.fillText(
          `|velocity| = ${vehicle.velocity.magnitude().toFixed(2)}`,
          12,
          28,
        );
      }
    };

    const update = () => {
      if (vehicle instanceof WallWanderingVehicleBody) {
        vehicle.wanderWithinWalls(width, height);
      } else if (vehicle instanceof WanderingVehicleBody) vehicle.wander();
      else vehicle.randomSteer();
      vehicle.update();
      const wrapped = vehicle.edges(width, height);
      if (wrapped) trail.push(null);
      trail.push(vehicle.position.copy());
      if (trail.length > WANDER_TRAIL_LENGTH) trail.shift();
    };

    const reset = () => {
      vehicle = createVehicle(width / 2, height / 2);
      if (vehicle instanceof RandomSteeringVehicleBody) {
        const angle = Math.random() * Math.PI * 2;
        vehicle.velocity.set(Math.cos(angle), Math.sin(angle));
      }
      trail = [];
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
  }, [random, wanderStep, minimumWanderDistance, walls]);

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
          aria-label={
            random
              ? "A vehicle pushed by a completely random steering force every frame, leaving a jittery, aimless trail"
              : "A vehicle wandering around the canvas by seeking a point that drifts around a circle projected ahead of it, leaving a smoothly curving trail"
          }
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}
