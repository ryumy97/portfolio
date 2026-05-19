import { Effect } from "postprocessing";
import { Uniform, Vector2 } from "three";

const fragmentShader = /* glsl */ `
uniform vec2 pixelSize;
uniform float maskStagger;

void mainUv(inout vec2 uv) {
  vec2 normalizedPixelSize = pixelSize / resolution.xy;
  vec2 coord = uv / normalizedPixelSize;

  float columnStagger = mod(floor(coord.x), 2.0) * maskStagger;

  vec2 subcoord = coord * vec2(3.0, 1.0);
  float subPixelIndex = mod(floor(subcoord.x), 3.0);
  float subPixelStagger = subPixelIndex * maskStagger;

  uv.y += (columnStagger + subPixelStagger) * normalizedPixelSize.y;
}
`;

export type StaggerEffectOptions = {
  pixelSize?: number;
  maskStagger?: number;
};

export class StaggerEffect extends Effect {
  constructor({
    pixelSize = 64,
    maskStagger = 0.5,
  }: StaggerEffectOptions = {}) {
    super("StaggerEffect", fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ["pixelSize", new Uniform(new Vector2(pixelSize, pixelSize))],
        ["maskStagger", new Uniform(maskStagger)],
      ]),
    });
  }

  setPixelSize(value: number) {
    this.uniforms.get("pixelSize")?.value.set(value, value);
  }

  setMaskStagger(value: number) {
    const uniform = this.uniforms.get("maskStagger");
    if (uniform) uniform.value = value;
  }
}
