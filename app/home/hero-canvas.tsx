"use client";

import { useEffect, useRef } from "react";
import { CANVAS_STYLE, observeCanvasPixelSize } from "@/lib/webgl";
import { pointer } from "@/stores/pointer";

const CORAL = "#f75d5d";
const SPRING = 0.012;
const DAMP = 0.985;
const WANDER = 55;
const MAX_SPEED = 90;
const NEIGHBORS = 3;
const OFFSET_FOLLOW = 3;
const OFFSET_SETTLE = 1.6;

type Particle = {
  restX: number;
  restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
  phase: number;
  radius: number;
};

type Link = {
  a: number;
  b: number;
};

type Point = { x: number; y: number };

function hash(i: number, salt: number) {
  const n = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function display(p: Particle): Point {
  return { x: p.x + p.ox, y: p.y + p.oy };
}

function spawn(width: number, height: number) {
  const area = Math.max(width * height, 1);
  const count = Math.max(20, Math.min(48, Math.round(area / 14000)));
  const cols = Math.max(3, Math.round(Math.sqrt(count * (width / height))));
  const rows = Math.max(3, Math.ceil(count / cols));
  const insetX = width * 0.08;
  const insetY = height * 0.1;
  const cellW = (width - insetX * 2) / Math.max(cols - 1, 1);
  const cellH = (height - insetY * 2) / Math.max(rows - 1, 1);
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (row >= rows) break;
    const jitterX = (hash(i, 1.1) - 0.5) * cellW * 0.55;
    const jitterY = (hash(i, 2.4) - 0.5) * cellH * 0.55;
    const x = insetX + col * cellW + jitterX;
    const y = insetY + row * cellH + jitterY;
    const heading = hash(i, 8.2) * Math.PI * 2;
    const speed = 18 + hash(i, 9.1) * 22;
    particles.push({
      restX: x,
      restY: y,
      x,
      y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      ox: 0,
      oy: 0,
      phase: hash(i, 3.7) * Math.PI * 2,
      radius: 1.6 + hash(i, 5.2) * 1.6,
    });
  }

  return particles;
}

function linksFor(particles: Particle[], maxDist: number) {
  const links: Link[] = [];
  const maxDistSq = maxDist * maxDist;
  const points = particles.map(display);
  for (let i = 0; i < points.length; i++) {
    const nearby: Array<{ j: number; d: number }> = [];
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      const d = dx * dx + dy * dy;
      if (d > maxDistSq) continue;
      nearby.push({ j, d });
    }
    nearby.sort((a, b) => a.d - b.d);
    const take = nearby.slice(0, NEIGHBORS);
    for (const item of take) {
      links.push({ a: i, b: item.j });
    }
  }
  return links;
}

const HeroCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let visible = true;
    let then = 0;
    let time = 0;
    let pointerX = width * 0.5;
    let pointerY = height * 0.5;
    let hovering = false;
    let pressed = false;
    let particles = spawn(width, height);

    const pushRadius = () => Math.min(width, height) * 0.32;
    const linkDist = () =>
      Math.min(150, Math.max(72, Math.min(width, height) * 0.26));

    const readPointer = () => {
      const rect = canvas.getBoundingClientRect();
      pointerX = pointer.target.x - rect.left;
      pointerY = pointer.target.y - rect.top;
      hovering =
        pointerX >= 0 &&
        pointerX <= width &&
        pointerY >= 0 &&
        pointerY <= height;
    };

    const step = (dt: number) => {
      time += dt;
      const radius = pushRadius();
      const radiusSq = radius * radius;
      const scale = pressed ? 0.7 : 0.5;
      const toward = 1 - Math.exp(-OFFSET_FOLLOW * dt);
      const settle = 1 - Math.exp(-OFFSET_SETTLE * dt);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let ax = (p.restX - p.x) * SPRING;
        let ay = (p.restY - p.y) * SPRING;
        ax += Math.cos(time * 0.55 + p.phase) * WANDER;
        ay += Math.sin(time * 0.42 + p.phase * 1.3) * WANDER;

        p.vx = (p.vx + ax * dt) * DAMP;
        p.vy = (p.vy + ay * dt) * DAMP;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > MAX_SPEED) {
          p.vx *= MAX_SPEED / speed;
          p.vy *= MAX_SPEED / speed;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const pad = p.radius + 2;
        if (p.x < pad) {
          p.x = pad;
          p.vx = Math.abs(p.vx);
        } else if (p.x > width - pad) {
          p.x = width - pad;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y < pad) {
          p.y = pad;
          p.vy = Math.abs(p.vy);
        } else if (p.y > height - pad) {
          p.y = height - pad;
          p.vy = -Math.abs(p.vy);
        }

        const dx = p.x - pointerX;
        const dy = p.y - pointerY;
        const distSq = dx * dx + dy * dy;
        const inRange = hovering && distSq < radiusSq && distSq > 0.0001;

        let targetOx = 0;
        let targetOy = 0;
        if (inRange) {
          const dist = Math.sqrt(distSq);
          const mag = (radius - dist) * scale;
          targetOx = (dx / dist) * mag;
          targetOy = (dy / dist) * mag;
        }

        const mix = inRange ? toward : settle;
        p.ox += (targetOx - p.ox) * mix;
        p.oy += (targetOy - p.oy) * mix;
      }
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.strokeStyle = CORAL;
      ctx.fillStyle = CORAL;

      const links = linksFor(particles, linkDist());
      const maxLink = linkDist();
      const points = particles.map(display);

      ctx.lineWidth = 1;
      for (const link of links) {
        const a = points[link.a];
        const b = points[link.b];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        ctx.globalAlpha = 0.12 + 0.4 * (1 - dist / maxLink);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const point = points[i];
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.arc(point.x, point.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      if (!running) return;
      const elapsed = then ? now - then : 1000 / 60;
      then = now;
      let dt = elapsed / 1000;
      if (dt > 1 / 20) dt = 1 / 20;
      readPointer();
      if (visible && !reduceMotion) step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("a, button, header, [data-slot=button]")
      ) {
        return;
      }
      readPointer();
      if (!hovering) return;
      pressed = true;
    };

    const onPointerUp = () => {
      pressed = false;
    };

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      dpr = size.w / Math.max(canvas.clientWidth, 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      particles = spawn(width, height);
      draw();
    });

    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    observer.observe(canvas);

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      disconnectResize();
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none h-full w-full"
      style={CANVAS_STYLE}
    />
  );
};

export default HeroCanvas;
