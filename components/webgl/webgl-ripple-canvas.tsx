"use client";

import { useEffect, useRef } from "react";

export type WebGLRippleCanvasProps = {
	className?: string;
	/** Max number of concurrent ripples. Defaults to 10. */
	maxRipples?: number;
};

const MAX_RIPPLES = 24;
const POINTER_THROTTLE_MS = 10;

const VS = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = 0.5 * (a_pos + 1.0);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FS = `
precision mediump float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_ripples[${MAX_RIPPLES}];
uniform vec2 u_rippleVel[${MAX_RIPPLES}];

void main() {
  vec2 uv = v_uv;
  vec2 normalizedPixelSize = 50.0 / u_resolution;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

  float wave = 0.0;

  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec2 center = u_ripples[i].xy;
    float birth = u_ripples[i].z;
    float velocity = u_ripples[i].w;

    if (birth < 0.0) continue;

    float age = u_time - birth;
    vec2 vel = u_rippleVel[i];
    vec2 movedCenter = center + vel * age;

    float radius = age * 0.4;
    float fadeOut = exp(-age * 6.0);

    float dist = length((uv - movedCenter) * aspect);
    float ring = sin((dist - radius) * 40.0) * fadeOut;
    ring *= smoothstep(radius + 0.05, radius, dist);
    ring *= smoothstep(0.0, 0.02, dist);

    wave += ring;
  }

  float alpha = clamp(abs(wave), 0.0, 1.0);
  float u_radius = 0.72;

  // cell	
  vec2 cellUv = fract(uv / normalizedPixelSize);
  float dist = length(cellUv - 0.5);

  // shape - gradient effecting cell 
  float circle = 1.0 - smoothstep((u_radius - 0.01) * alpha, (u_radius + 0.01) * alpha, dist);


  // color
  vec3 color = vec3(0.969, 0.365, 0.365);

  gl_FragColor = vec4(color, circle);
}
`;

function compile(
	gl: WebGLRenderingContext,
	type: number,
	source: string,
): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function linkProgram(
	gl: WebGLRenderingContext,
	vs: WebGLShader,
	fs: WebGLShader,
): WebGLProgram | null {
	const program = gl.createProgram();
	if (!program) return null;
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		gl.deleteProgram(program);
		return null;
	}
	return program;
}

type Ripple = {
	x: number;
	y: number;
	birth: number;
	velocity: number;
	vx: number;
	vy: number;
};

export function WebGLRippleCanvas({
	className,
	maxRipples = MAX_RIPPLES,
}: WebGLRippleCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ripplesRef = useRef<Ripple[]>([]);
	const startTimeRef = useRef(0);
	const rafRef = useRef(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl", {
			alpha: true,
			premultipliedAlpha: false,
			antialias: false,
		});
		if (!gl) return;

		const vs = compile(gl, gl.VERTEX_SHADER, VS);
		const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
		if (!vs || !fs) return;

		const program = linkProgram(gl, vs, fs);
		gl.deleteShader(vs);
		gl.deleteShader(fs);
		if (!program) return;

		const aPos = gl.getAttribLocation(program, "a_pos");
		const uResolution = gl.getUniformLocation(program, "u_resolution");
		const uTimeLoc = gl.getUniformLocation(program, "u_time");
		const uRippleLocs: WebGLUniformLocation[] = [];
		const uRippleVelLocs: WebGLUniformLocation[] = [];
		for (let i = 0; i < maxRipples; i++) {
			const loc = gl.getUniformLocation(program, `u_ripples[${i}]`);
			if (loc) uRippleLocs.push(loc);
			const velLoc = gl.getUniformLocation(program, `u_rippleVel[${i}]`);
			if (velLoc) uRippleVelLocs.push(velLoc);
		}

		const buf = gl.createBuffer();
		if (!buf) {
			gl.deleteProgram(program);
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 3, -1, -1, 3]),
			gl.STATIC_DRAW,
		);

		const applyProgram = gl.useProgram.bind(gl);
		startTimeRef.current = performance.now() / 1000;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		const draw = () => {
			const now = performance.now() / 1000 - startTimeRef.current;
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			applyProgram(program);

			if (uResolution) {
				gl.uniform2f(
					uResolution,
					gl.drawingBufferWidth,
					gl.drawingBufferHeight,
				);
			}
			if (uTimeLoc) gl.uniform1f(uTimeLoc, now);

			const ripples = ripplesRef.current;
			for (let i = 0; i < maxRipples; i++) {
				const loc = uRippleLocs[i];
				const velLoc = uRippleVelLocs[i];
				if (i < ripples.length) {
					if (loc)
						gl.uniform4f(
							loc,
							ripples[i].x,
							ripples[i].y,
							ripples[i].birth,
							ripples[i].velocity,
						);
					if (velLoc) gl.uniform2f(velLoc, ripples[i].vx, ripples[i].vy);
				} else {
					if (loc) gl.uniform4f(loc, 0, 0, -1, 0);
					if (velLoc) gl.uniform2f(velLoc, 0, 0);
				}
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.enableVertexAttribArray(aPos);
			gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		};

		const loop = () => {
			draw();
			rafRef.current = requestAnimationFrame(loop);
		};

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
			const w = Math.floor(canvas.clientWidth * dpr);
			const h = Math.floor(canvas.clientHeight * dpr);
			if (w > 0 && h > 0) {
				canvas.width = w;
				canvas.height = h;
			}
		};

		let lastPointerTime = 0;
		let lastPointerX = 0;
		let lastPointerY = 0;

		const handlePointer = (e: PointerEvent) => {
			const now = performance.now();
			if (now - lastPointerTime < POINTER_THROTTLE_MS) return;

			const rect = canvas.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = 1.0 - (e.clientY - rect.top) / rect.height;

			const dt = (now - lastPointerTime) / 1000;
			const dx = x - lastPointerX;
			const dy = y - lastPointerY;
			const speed = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / dt : 0;
			const velocity = Math.min(speed * 1000, 1.0);
			const vx = dt > 0 ? (dx / dt) * 0.3 : 0;
			const vy = dt > 0 ? (dy / dt) * 0.3 : 0;

			lastPointerTime = now;
			lastPointerX = x;
			lastPointerY = y;

			const t = now / 1000 - startTimeRef.current;

			ripplesRef.current.push({ x, y, birth: t, velocity, vx, vy });
			if (ripplesRef.current.length > maxRipples) {
				ripplesRef.current.shift();
			}
		};

		window.addEventListener("pointermove", handlePointer);
		window.addEventListener("pointerdown", handlePointer);

		const ro = new ResizeObserver(resize);
		ro.observe(canvas);
		resize();
		loop();

		return () => {
			ro.disconnect();
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener("pointermove", handlePointer);
			window.removeEventListener("pointerdown", handlePointer);
			gl.deleteBuffer(buf);
			gl.deleteProgram(program);
		};
	}, [maxRipples]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ display: "block", width: "100%", height: "100%" }}
		/>
	);
}
