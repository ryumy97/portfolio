import { FULLSCREEN_TRIANGLE } from "./constants";

export const QUAD_VS = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 vCellUv;
void main() {
  vCellUv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const QUAD_STRIDE = 16;

export type CellRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function pixelToClip(
  x: number,
  y: number,
  bufferW: number,
  bufferH: number,
): [number, number] {
  return [(x / bufferW) * 2 - 1, (y / bufferH) * 2 - 1];
}

/** Six vertices (pos.xy + cellUv.xy) for an expanded cell quad in clip space. */
export function buildCellQuadVerts(
  rect: CellRect,
  pad: number,
  bufferW: number,
  bufferH: number,
): Float32Array {
  const u0 = -pad / rect.w;
  const u1 = 1 + pad / rect.w;
  const v0 = -pad / rect.h;
  const v1 = 1 + pad / rect.h;

  const x0 = rect.x - pad;
  const x1 = rect.x + rect.w + pad;
  const y0 = rect.y - pad;
  const y1 = rect.y + rect.h + pad;

  const bl = pixelToClip(x0, y0, bufferW, bufferH);
  const br = pixelToClip(x1, y0, bufferW, bufferH);
  const tl = pixelToClip(x0, y1, bufferW, bufferH);
  const tr = pixelToClip(x1, y1, bufferW, bufferH);

  return new Float32Array([
    bl[0],
    bl[1],
    u0,
    v0,
    br[0],
    br[1],
    u1,
    v0,
    tl[0],
    tl[1],
    u0,
    v1,
    br[0],
    br[1],
    u1,
    v0,
    tr[0],
    tr[1],
    u1,
    v1,
    tl[0],
    tl[1],
    u0,
    v1,
  ]);
}

export function createQuadBuffer(
  gl: WebGLRenderingContext,
): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  if (!buffer) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, 6 * 4 * 4, gl.DYNAMIC_DRAW);
  return buffer;
}

export function updateQuadBuffer(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  verts: Float32Array,
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts);
}

export function drawQuad(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  buffer: WebGLBuffer,
) {
  const posLoc = gl.getAttribLocation(program, "a_pos");
  const uvLoc = gl.getAttribLocation(program, "a_uv");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, QUAD_STRIDE, 0);
  gl.enableVertexAttribArray(uvLoc);
  gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, QUAD_STRIDE, 8);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

export function createFullscreenTriangleBuffer(
  gl: WebGLRenderingContext,
): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  if (!buffer) return null;

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE, gl.STATIC_DRAW);
  return buffer;
}

export function drawFullscreenTriangle(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  buffer: WebGLBuffer,
  attribName = "a_pos",
) {
  const location = gl.getAttribLocation(program, attribName);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
