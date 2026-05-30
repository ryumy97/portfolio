import { Effect } from "postprocessing";
import { Uniform, Vector3 } from "three";

const fragmentShader = /* glsl */ `
uniform float distortion;
uniform vec3 lightPosition;
uniform float fill;

#define PI 3.141592653589793

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float fluteCount = 25.0;
  float flutePosition = fract(uv.x * fluteCount + 0.5);

  vec3 normal = vec3(0.0);
  normal.x = cos(flutePosition * PI * 2.0) * PI * 0.15;
  normal.y = 0.0;
  normal.z = sqrt(1.0 - normal.x * normal.x);
  normal = normalize(normal);

  vec3 lightDir = normalize(lightPosition);
  float diffuse = max(dot(normal, lightDir), 0.0);
  float specular = pow(
    max(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0),
    32.0
  );

  vec2 distortedUV = uv + normal.xy * distortion;

  if (uv.x < fill) {
    const float sigma = 20.0;
    float noiseScale = 1.0;
    float frostAmount = 0.002;
    vec2 noiseUV = distortedUV * noiseScale;
    float noise = random(noiseUV) * 2.0 - 1.0;

    float blurSize = 0.004;
    float totalWeight = 0.0;
    vec4 color = texture2D(inputBuffer, distortedUV);

    float colorR = 0.0;
    float colorG = 0.0;
    float colorB = 0.0;

    for (float i = -2.0; i <= 2.0; i++) {
      for (float j = -2.0; j <= 2.0; j++) {
        vec2 offset = vec2(i, j) * blurSize;
        float weight = exp(-(i * i + j * j) / (2.0 * sigma * sigma));
        vec2 sampleUV = distortedUV + noise * frostAmount + offset;

        colorR += texture2D(inputBuffer, sampleUV + vec2(distortion, 0.0) * 0.02).r * weight;
        colorG += texture2D(inputBuffer, sampleUV).g * weight;
        colorB += texture2D(inputBuffer, sampleUV - vec2(distortion, 0.0) * 0.02).b * weight;
        totalWeight += weight;
      }
    }

    color /= totalWeight;
    color.r = colorR / totalWeight;
    color.g = colorG / totalWeight;
    color.b = colorB / totalWeight;
    color.a = 1.0;

    float ambient = 0.5;
    color.rgb *= (ambient + diffuse * 0.5);
    color.rgb += specular * 0.05;
    outputColor = color;
  } else {
    outputColor = inputColor;
  }
}
`;

export const LIGHT_CURTAIN_EFFECT_DEFAULTS = {
	distortion: 0.2,
	lightX: 1,
	lightY: 0,
	lightZ: 1,
	fill: 0.5,
} as const;

export type LightCurtainEffectOptions = {
	distortion?: number;
	lightPosition?: Vector3 | [number, number, number];
	fill?: number;
};

export class LightCurtainEffect extends Effect {
	constructor({
		distortion = LIGHT_CURTAIN_EFFECT_DEFAULTS.distortion,
		lightPosition = [
			LIGHT_CURTAIN_EFFECT_DEFAULTS.lightX,
			LIGHT_CURTAIN_EFFECT_DEFAULTS.lightY,
			LIGHT_CURTAIN_EFFECT_DEFAULTS.lightZ,
		],
		fill = LIGHT_CURTAIN_EFFECT_DEFAULTS.fill,
	}: LightCurtainEffectOptions = {}) {
		const position =
			lightPosition instanceof Vector3
				? lightPosition.clone()
				: new Vector3(...lightPosition);

		super("LightCurtainEffect", fragmentShader, {
			uniforms: new Map<string, Uniform>([
				["distortion", new Uniform(distortion)],
				["lightPosition", new Uniform(position)],
				["fill", new Uniform(fill)],
			]),
		});
	}

	setDistortion(value: number) {
		const uniform = this.uniforms.get("distortion");
		if (uniform) uniform.value = value;
	}

	setLightPosition(value: Vector3 | [number, number, number]) {
		const uniform = this.uniforms.get("lightPosition");
		if (!uniform) return;
		if (value instanceof Vector3) {
			uniform.value.copy(value);
		} else {
			uniform.value.set(value[0], value[1], value[2]);
		}
	}

	setFill(value: number) {
		const uniform = this.uniforms.get("fill");
		if (uniform) uniform.value = value;
	}
}
