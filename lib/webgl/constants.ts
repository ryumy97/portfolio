export const FULLSCREEN_VS = `
attribute vec2 a_pos;
varying vec2 vUv;
void main() {
  vUv = 0.5 * (a_pos + 1.0);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

export const FULLSCREEN_TRIANGLE = new Float32Array([-1, -1, 3, -1, -1, 3]);

export const CANVAS_STYLE = {
  display: "block",
  width: "100%",
  height: "100%",
} as const;

export const WEBGL_CONTEXT_OPTIONS: WebGLContextAttributes = {
  alpha: true,
  premultipliedAlpha: false,
  antialias: false,
};

export const MAX_DEVICE_PIXEL_RATIO = 2;
