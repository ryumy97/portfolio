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

const FLOW_FIELD_RESOLUTION = 25;
const FLOW_FIELD_NOISE_STEP = 0.1;

type FlowFieldKind = "uniform" | "random" | "perlin" | "texture" | "video";

const TEXTURE_ARROW_LENGTH = 40;
const FLOW_FIELD_MAX_VEHICLES = 20;
const FLOW_FIELD_VIDEO_SRC =
  "/blog/studying-the-nature-of-code/flow-fields-perlin.mp4";
const FLOW_FIELD_TEXTURE_SRC =
  "/blog/studying-the-nature-of-code/flow-fields-noise.png";

const GRAD2 = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function noiseLerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

function noiseFade(t: number) {
  return 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;
}

/** Deterministic gradient pick from a lattice index. */
function noiseGradient(ix: number, iy: number) {
  let n = (ix * 374761393 + iy * 668265263) | 0;
  n = (n ^ (n >>> 13)) >>> 0;
  return GRAD2[n & 7];
}

/** Matches noise2D in the flow fields post: 2D gradient noise, roughly in [0, 1]. */
function noise2D(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = x - x0;
  const yf = y - y0;

  const g00 = noiseGradient(x0, y0);
  const g10 = noiseGradient(x0 + 1, y0);
  const g01 = noiseGradient(x0, y0 + 1);
  const g11 = noiseGradient(x0 + 1, y0 + 1);

  const n00 = g00[0] * xf + g00[1] * yf;
  const n10 = g10[0] * (xf - 1) + g10[1] * yf;
  const n01 = g01[0] * xf + g01[1] * (yf - 1);
  const n11 = g11[0] * (xf - 1) + g11[1] * (yf - 1);

  const u = noiseFade(xf);
  const v = noiseFade(yf);
  const nx0 = noiseLerp(n00, n10, u);
  const nx1 = noiseLerp(n01, n11, u);
  const raw = noiseLerp(nx0, nx1, v);

  return (raw + 1) / 2;
}

/** Matches the ImageFlowField in the flow fields post: looks up a direction straight from the texture, with lookup.x and lookup.y from 0 to 1. */
export class ImageFlowFieldBody {
  texture: ImageData;

  constructor(texture: ImageData) {
    this.texture = texture;
  }

  lookup(lookup: Vector2D) {
    const x = Math.min(
      this.texture.width - 1,
      Math.max(0, lookup.x * this.texture.width),
    );
    const y = Math.min(
      this.texture.height - 1,
      Math.max(0, lookup.y * this.texture.height),
    );
    const index = (Math.floor(y) * this.texture.width + Math.floor(x)) * 4;
    const r = this.texture.data[index];
    const g = this.texture.data[index + 1];
    const b = this.texture.data[index + 2];
    const angle = ((r + g + b) / 3 / 255) * Math.PI * 2;
    return new Vector2D(Math.cos(angle), Math.sin(angle));
  }
}

/** Matches the FlowFields in the flow fields post: a grid of vectors, one per resolution-sized cell. */
export class FlowFieldBody {
  field: Vector2D[][] = [];
  cols: number;
  rows: number;
  resolution: number;

  constructor(
    width: number,
    height: number,
    resolution: number,
    kind: FlowFieldKind = "uniform",
    imageField: ImageFlowFieldBody | null = null,
  ) {
    this.resolution = resolution;
    this.cols = Math.ceil(width / this.resolution);
    this.rows = Math.ceil(height / this.resolution);

    // noise2D always returns the same field, so each new field samples a different region of it
    const noiseOffsetX = Math.floor(Math.random() * 1000);
    const noiseOffsetY = Math.floor(Math.random() * 1000);

    for (let j = 0; j < this.rows; j++) {
      this.field[j] = [];
      for (let i = 0; i < this.cols; i++) {
        if (imageField) {
          // Only for drawing: a sample of the image field at each cell's centre
          this.field[j][i] = imageField.lookup(
            new Vector2D(
              ((i + 0.5) * this.resolution) / width,
              ((j + 0.5) * this.resolution) / height,
            ),
          );
        } else if (kind === "perlin") {
          const theta =
            noise2D(
              noiseOffsetX + i * FLOW_FIELD_NOISE_STEP,
              noiseOffsetY + j * FLOW_FIELD_NOISE_STEP,
            ) *
            Math.PI *
            2;
          this.field[j][i] = new Vector2D(Math.cos(theta), Math.sin(theta));
        } else if (kind === "random") {
          this.field[j][i] = new Vector2D(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
          ).normalize();
        } else {
          this.field[j][i] = new Vector2D(1, 0);
        }
      }
    }
  }

  lookup(position: Vector2D) {
    const column = Math.min(
      this.cols - 1,
      Math.max(0, Math.floor(position.x / this.resolution)),
    );
    const row = Math.min(
      this.rows - 1,
      Math.max(0, Math.floor(position.y / this.resolution)),
    );
    return this.field[row][column].copy();
  }
}

/** Matches the flow field following Vehicle in the flow fields post. */
export class FlowFieldVehicleBody extends VehicleBody {
  follow(flowField: { lookup(position: Vector2D): Vector2D }) {
    const desired = flowField.lookup(this.position);
    desired.multiply(this.maxSpeed);

    const steer = Vector2D.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    this.applyForce(steer);
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vector: Vector2D,
  length: number,
) {
  const angle = Math.atan2(vector.y, vector.x);
  const head = length * 0.3;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-length / 2, 0);
  ctx.lineTo(length / 2, 0);
  ctx.moveTo(length / 2 - head, -head * 0.6);
  ctx.lineTo(length / 2, 0);
  ctx.lineTo(length / 2 - head, head * 0.6);
  ctx.stroke();
  ctx.restore();
}

/** A flow field where every cell holds the same vector pointing right, drawn as a grid of arrows. */
export function FlowFieldArrows({ className }: { className?: string }) {
  return <FlowFieldSketch className={className} title="Flow field" />;
}

/** A vehicle following the flow field where every cell points right. */
export function FlowFieldVehicle({ className }: { className?: string }) {
  return (
    <FlowFieldSketch
      className={className}
      title="Following a flow field"
      vehicle
    />
  );
}

/** A vehicle following a flow field where every cell holds a random unit vector. */
export function FlowFieldArrowsRandom({ className }: { className?: string }) {
  return (
    <FlowFieldSketch
      className={className}
      title="Random flow field"
      kind="random"
      vehicle
    />
  );
}

/** A vehicle following a flow field whose angles come from the brightness of a texture image. */
export function FlowFieldArrowsTexture({ className }: { className?: string }) {
  return (
    <FlowFieldSketch
      className={className}
      title="Texture flow field"
      kind="texture"
      vehicle
    />
  );
}

/** Vehicles following a flow field read from a looping Perlin noise video, so the field changes every frame. */
export function FlowFieldArrowsTextureVideo({
  className,
}: {
  className?: string;
}) {
  return (
    <FlowFieldSketch
      className={className}
      title="Video flow field"
      kind="video"
      vehicle
    />
  );
}

/** A vehicle following a flow field whose angles come from 2D Perlin noise, so neighbouring cells point in similar directions. */
export function FlowFieldArrowsPerlin({ className }: { className?: string }) {
  return (
    <FlowFieldSketch
      className={className}
      title="Perlin noise flow field"
      kind="perlin"
      vehicle
    />
  );
}

const FLOW_FIELD_LABELS: Record<FlowFieldKind, string> = {
  uniform:
    "A grid of cells, each holding the same vector pointing right, drawn as arrows",
  random:
    "A grid of cells, each holding a random unit vector, drawn as arrows pointing in every direction",
  perlin:
    "A grid of cells whose vectors come from Perlin noise, drawn as arrows that turn smoothly from cell to cell",
  texture:
    "A streaky black and white texture stretched over the canvas, with an arrow at the vehicle showing the direction looked up from the brightness under it",
  video:
    "A looping video of drifting black and white Perlin noise stretched over the canvas, with an arrow at each vehicle showing the direction looked up from the current frame",
};

function FlowFieldSketch({
  className,
  title,
  kind = "uniform",
  vehicle: withVehicle = false,
}: {
  className?: string;
  title: string;
  kind?: FlowFieldKind;
  vehicle?: boolean;
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
    let flowField: FlowFieldBody | null = null;
    // Each vehicle with its recent positions; null breaks the line where it wrapped around
    let vehicles: { body: FlowFieldVehicleBody; trail: (Vector2D | null)[] }[] =
      [];
    const textured = kind === "texture" || kind === "video";
    let textureImage: HTMLImageElement | HTMLVideoElement | null = null;
    let video: HTMLVideoElement | null = null;
    const offscreen = document.createElement("canvas");
    const offscreenCtx = offscreen.getContext("2d", {
      willReadFrequently: true,
    });
    let imageField: ImageFlowFieldBody | null = null;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0 || !flowField) return;

      const { resolution } = flowField;

      if (textureImage) {
        // Stretched over the whole canvas, as lookup maps 0 to 1 onto the full texture
        ctx.globalAlpha = 0.35;
        ctx.drawImage(textureImage, 0, 0, width, height);
        ctx.globalAlpha = 1;
      }

      // The cells the vehicles are looking up; the image field has no cells
      if (!imageField) {
        ctx.fillStyle = muted;
        ctx.globalAlpha = 0.2;
        for (const { body } of vehicles) {
          const column = Math.floor(body.position.x / resolution);
          const row = Math.floor(body.position.y / resolution);
          ctx.fillRect(
            column * resolution,
            row * resolution,
            resolution,
            resolution,
          );
        }
        ctx.globalAlpha = 1;
      }

      // Cell grid; the image field has no cells
      if (!imageField) {
        ctx.strokeStyle = muted;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < flowField.cols; i++) {
          ctx.moveTo(i * resolution, 0);
          ctx.lineTo(i * resolution, height);
        }
        for (let j = 1; j < flowField.rows; j++) {
          ctx.moveTo(0, j * resolution);
          ctx.lineTo(width, j * resolution);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // One arrow per cell, at the cell's centre
      ctx.strokeStyle = withVehicle ? muted : color;
      ctx.lineWidth = 1;
      if (!imageField) {
        for (let j = 0; j < flowField.rows; j++) {
          for (let i = 0; i < flowField.cols; i++) {
            drawArrow(
              ctx,
              (i + 0.5) * resolution,
              (j + 0.5) * resolution,
              flowField.field[j][i],
              resolution * 0.6,
            );
          }
        }
      }

      for (const { body, trail } of vehicles) {
        // The image field's direction at the vehicle, from its lookup
        if (imageField) {
          const { position } = body;
          const direction = imageField.lookup(
            new Vector2D(position.x / width, position.y / height),
          );
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          // drawArrow centres the arrow, so shift it forward to start at the vehicle
          drawArrow(
            ctx,
            position.x + (direction.x * TEXTURE_ARROW_LENGTH) / 2,
            position.y + (direction.y * TEXTURE_ARROW_LENGTH) / 2,
            direction,
            TEXTURE_ARROW_LENGTH,
          );
          ctx.lineWidth = 1;
        }

        ctx.strokeStyle = color;
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

        body.show(ctx, primary);
      }
    };

    const spawnVehicle = (x: number, y: number) => {
      vehicles.push({ body: new FlowFieldVehicleBody(x, y), trail: [] });
      if (vehicles.length > FLOW_FIELD_MAX_VEHICLES) vehicles.shift();
    };

    const update = () => {
      if (!flowField) return;
      // A video texture changes every frame, so read its pixels again
      if (video && imageField && video.readyState >= 2) {
        const texture = readTexture();
        if (texture) imageField.texture = texture;
      }
      const field = flowField;
      const image = imageField;
      for (const { body, trail } of vehicles) {
        if (image) {
          // The image field takes positions from 0 to 1
          body.follow({
            lookup: (position) =>
              image.lookup(
                new Vector2D(position.x / width, position.y / height),
              ),
          });
        } else {
          body.follow(field);
        }
        body.update();
        if (body.edges(width, height)) trail.push(null);
        trail.push(body.position.copy());
        if (trail.length > WANDER_TRAIL_LENGTH) trail.shift();
      }
    };

    /** The texture's own pixels, at its original size. */
    function readTexture() {
      if (!textureImage || !offscreenCtx) return null;
      const textureWidth =
        textureImage instanceof HTMLVideoElement
          ? textureImage.videoWidth
          : textureImage.naturalWidth;
      const textureHeight =
        textureImage instanceof HTMLVideoElement
          ? textureImage.videoHeight
          : textureImage.naturalHeight;
      if (textureWidth <= 0 || textureHeight <= 0) return null;
      if (offscreen.width !== textureWidth) offscreen.width = textureWidth;
      if (offscreen.height !== textureHeight) offscreen.height = textureHeight;
      offscreenCtx.drawImage(textureImage, 0, 0);
      return offscreenCtx.getImageData(0, 0, textureWidth, textureHeight);
    }

    const reset = () => {
      if (textured && !textureImage) return;
      const texture = textured ? readTexture() : null;
      imageField = texture ? new ImageFlowFieldBody(texture) : null;
      flowField = new FlowFieldBody(
        width,
        height,
        FLOW_FIELD_RESOLUTION,
        kind,
        imageField,
      );
      vehicles = [];
      if (withVehicle) {
        spawnVehicle(Math.random() * width, Math.random() * height);
      }
      draw();
    };

    resetRef.current = reset;

    const tick = () => {
      raf = 0;
      if (!running || !visible) return;
      if (video) {
        if (playingRef.current && video.paused) void video.play();
        else if (!playingRef.current && !video.paused) video.pause();
      }
      if (playingRef.current) {
        update();
        draw();
      }
      raf = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!withVehicle || !running || !visible || raf) return;
      raf = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      video?.pause();
      if (!raf) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!withVehicle) return;
      const rect = canvas.getBoundingClientRect();
      spawnVehicle(event.clientX - rect.left, event.clientY - rect.top);
      draw();
    };
    canvas.addEventListener("pointerdown", onPointerDown);

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const styles = getComputedStyle(canvas);
      color = styles.color || color;
      primary = styles.getPropertyValue("--primary").trim() || primary;
      muted = styles.getPropertyValue("--muted-foreground").trim() || muted;

      const cols = Math.ceil(width / FLOW_FIELD_RESOLUTION);
      const rows = Math.ceil(height / FLOW_FIELD_RESOLUTION);
      if (
        !flowField ||
        flowField.cols !== cols ||
        flowField.rows !== rows ||
        textured
      ) {
        reset();
      } else {
        draw();
      }
    });

    if (kind === "texture") {
      const image = new Image();
      image.onload = () => {
        if (!running) return;
        textureImage = image;
        reset();
      };
      image.src = FLOW_FIELD_TEXTURE_SRC;
    }

    const videoElement =
      kind === "video" ? document.createElement("video") : null;
    if (videoElement) {
      const element = videoElement;
      element.muted = true;
      element.loop = true;
      element.playsInline = true;
      element.preload = "auto";
      element.onloadeddata = () => {
        if (!running) return;
        video = element;
        textureImage = element;
        reset();
      };
      element.src = FLOW_FIELD_VIDEO_SRC;
    }

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
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
        videoElement.load();
      }
      canvas.removeEventListener("pointerdown", onPointerDown);
      disconnectVisibility();
      disconnectResize();
      resetRef.current = () => {};
    };
  }, [kind, withVehicle]);

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
        {withVehicle ? (
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
        ) : null}
      </div>
      <div className="relative aspect-2/1 w-full">
        <canvas
          ref={canvasRef}
          aria-label={`${FLOW_FIELD_LABELS[kind]}${withVehicle ? ". Vehicles steer by the vector in whichever cell they are in. Click to add a vehicle" : ""}`}
          className="h-full w-full"
          style={CANVAS_STYLE}
        />
      </div>
    </div>
  );
}
