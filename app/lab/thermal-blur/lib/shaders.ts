const PERLIN = `
vec2 fade2(vec2 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

vec2 hash22(vec2 p) {
  p = vec2(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3))
  );
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float perlin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = fade2(f);

  float n00 = dot(hash22(i), f);
  float n10 = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float n01 = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float n11 = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

  return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
}
`;

export const NOISE_MAP_FS = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform float uNoiseScale;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uPointerRadius;
uniform float uPointerStrength;

${PERLIN}

void main() {
  vec2 p = vUv * uNoiseScale + vec2(uTime * 0.11, uTime * 0.07);
  float n = perlin(p) * 0.35 + 0.65;

  vec2 delta = vUv - uMouse;
  delta.x *= uResolution.x / uResolution.y;
  float dist = length(delta);
  float influence = exp(-(dist * dist) / (uPointerRadius * uPointerRadius));
  float pointer = mix(1.0, influence, uPointerStrength);
  n *= pointer;

  gl_FragColor = vec4(vec3(n), 1.0);
}
`;

const BLUR_FROM_NOISE_MAP = `
uniform sampler2D uNoiseMap;
uniform float uBlurThreshold;
uniform float uBlurSoftness;

float blurMask(vec2 uv) {
  float n = texture2D(uNoiseMap, uv).r;
  return smoothstep(uBlurThreshold, uBlurThreshold + uBlurSoftness, n);
}
`;

const NOISE_BLUR = `
uniform sampler2D uTexture;
uniform vec2 uResolution;

const float NOISE_BLUR_REFERENCE_WIDTH = 1000.0;

float noiseBlurRadius(vec2 resolution) {
  return 5.0 * resolution.x / NOISE_BLUR_REFERENCE_WIDTH;
}

float sampleNoiseBlurH(vec2 uv, vec2 texel, float radius) {
  float sum = 0.0;
  float weightSum = 0.0;

  for (int i = -4; i <= 4; i++) {
    float fi = float(i);
    float w = exp(-0.5 * (fi * fi) / 2.0);
    sum += texture2D(uTexture, uv + vec2(fi * texel.x * radius, 0.0)).r * w;
    weightSum += w;
  }

  return sum / weightSum;
}

float sampleNoiseBlurV(vec2 uv, vec2 texel, float radius) {
  float sum = 0.0;
  float weightSum = 0.0;

  for (int i = -4; i <= 4; i++) {
    float fi = float(i);
    float w = exp(-0.5 * (fi * fi) / 2.0);
    sum += texture2D(uTexture, uv + vec2(0.0, fi * texel.y * radius)).r * w;
    weightSum += w;
  }

  return sum / weightSum;
}
`;

export const NOISE_BLUR_H_FS = `
precision mediump float;
varying vec2 vUv;

${NOISE_BLUR}

void main() {
  vec2 texel = 1.0 / uResolution;
  float radius = noiseBlurRadius(uResolution);
  float blurred = sampleNoiseBlurH(vUv, texel, radius);
  gl_FragColor = vec4(vec3(blurred), 1.0);
}
`;

export const NOISE_BLUR_V_FS = `
precision mediump float;
varying vec2 vUv;

${NOISE_BLUR}

void main() {
  vec2 texel = 1.0 / uResolution;
  float radius = noiseBlurRadius(uResolution);
  float blurred = sampleNoiseBlurV(vUv, texel, radius);
  gl_FragColor = vec4(vec3(blurred), 1.0);
}
`;

export const KAWASE_BLUR_FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uOffset;
uniform float uAngle;

void main() {
  vec2 off = vec2(uOffset) / uResolution;
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec2 axis = vec2(off.x * c - off.y * s, off.x * s + off.y * c);
  vec2 ortho = vec2(-axis.y, axis.x);

  float sum = texture2D(uTexture, vUv).r;
  sum += texture2D(uTexture, vUv + axis + ortho).r;
  sum += texture2D(uTexture, vUv + axis - ortho).r;
  sum += texture2D(uTexture, vUv - axis + ortho).r;
  sum += texture2D(uTexture, vUv - axis - ortho).r;
  gl_FragColor = vec4(vec3(sum / 5.0), 1.0);
}
`;

export const BLUR_MASK_MIX_FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uBlurred;
uniform vec2 uResolution;
uniform float uDrip;
uniform float uTime;

${BLUR_FROM_NOISE_MAP}

void main() {
  float mask = blurMask(vUv);
  float sharp = texture2D(uTexture, vUv).r;

  if (mask <= 0.001) {
    gl_FragColor = vec4(vec3(sharp), 1.0);
    return;
  }

  float dripBias = smoothstep(0.25, 1.0, 1.0 - vUv.y);
  float stretch = 1.0 + dripBias * uDrip + sin(uTime * 1.4 + vUv.x * 8.0) * 0.04 * dripBias;
  vec2 blurredUv = vUv;
  blurredUv.y += dripBias * stretch * 0.012;
  float blurred = texture2D(uBlurred, blurredUv).r;
  gl_FragColor = vec4(vec3(mix(sharp, blurred, mask)), 1.0);
}
`;

const PORTFOLIO_THERMAL = `
vec3 portfolioThermalColor(float v) {
  v = clamp(v, 0.0, 1.0);

  vec3 red = vec3(0.843137, 0.184314, 0.129412);
  vec3 yellow = vec3(0.964706, 0.854902, 0.458824);
  vec3 green = vec3(0.525490, 0.850980, 0.650980);
  vec3 lightBlue = vec3(0.607843, 0.749020, 0.827451);
  vec3 darkBlue = vec3(0.094118, 0.415686, 0.866667);

  if (v >= 0.82) return vec3(0.0);
  if (v <= 0.025) return vec3(1.0);
  if (v >= 0.65) return mix(red, vec3(0.0), (v - 0.65) / 0.17);
  if (v >= 0.48) return mix(yellow, red, (v - 0.48) / 0.17);
  if (v >= 0.31) return mix(green, yellow, (v - 0.31) / 0.17);
  if (v >= 0.14) return mix(lightBlue, green, (v - 0.14) / 0.17);
  float t = (v - 0.025) / 0.115;
  return mix(vec3(1.0), mix(darkBlue, lightBlue, t), smoothstep(0.0, 0.35, t));
}
`;

export const COMPOSITE_FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;

${PORTFOLIO_THERMAL}

void main() {
  float intensity = texture2D(uTexture, vUv).r;
  gl_FragColor = vec4(portfolioThermalColor(intensity), 1.0);
}
`;
