import * as THREE from "three";
import { TUNNEL_TEXTURE_SETS } from "./tunnel-colors";
import { createTunnelParticlesMaterial } from "./tunnel-particles-material";
import { createTunnelCurve, sampleTunnelWallPosition } from "./tunnel-path";

export type TunnelParticlesConfig = {
  count: number;
  tunnelRadius: number;
  wallThickness: number;
  size: number;
};

export const TUNNEL_PARTICLES_DEFAULTS: TunnelParticlesConfig = {
  count: 12000,
  tunnelRadius: 2.2,
  wallThickness: 1.6,
  size: 0.28,
};

export function buildTunnelParticlesGeometry({
  count,
  tunnelRadius,
  wallThickness,
}: Pick<TunnelParticlesConfig, "count" | "tunnelRadius" | "wallThickness">) {
  const curve = createTunnelCurve();
  const positions = new Float32Array(count * 3);
  const particleTypes = new Float32Array(count);
  const rotations = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const pathT = (i + Math.random()) / count;
    const angle = Math.random() * Math.PI * 2;
    const radialNorm = Math.random();
    const radius = tunnelRadius + radialNorm * wallThickness;

    const point = sampleTunnelWallPosition(curve, pathT, angle, radius);
    const i3 = i * 3;
    positions[i3] = point.x;
    positions[i3 + 1] = point.y;
    positions[i3 + 2] = point.z;

    const particleType = Math.floor(Math.random() * TUNNEL_TEXTURE_SETS);
    particleTypes[i] = particleType;
    rotations[i] = angle + pathT * Math.PI * 4 + particleType * (Math.PI / 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute(
    "particleType",
    new THREE.BufferAttribute(particleTypes, 1),
  );
  geometry.setAttribute("rotation", new THREE.BufferAttribute(rotations, 1));

  return geometry;
}

export function createTunnelParticles(
  config: TunnelParticlesConfig,
  textureAtlas: THREE.Texture,
  pixelRatio: number,
) {
  const geometry = buildTunnelParticlesGeometry(config);
  const material = createTunnelParticlesMaterial(
    textureAtlas,
    config.size,
    pixelRatio * window.innerHeight,
  );

  return { geometry, material };
}
