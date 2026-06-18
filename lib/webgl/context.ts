import { WEBGL_CONTEXT_OPTIONS } from "./constants";

export function getWebGLContext(
  canvas: HTMLCanvasElement,
): WebGLRenderingContext | null {
  return canvas.getContext("webgl", WEBGL_CONTEXT_OPTIONS);
}
