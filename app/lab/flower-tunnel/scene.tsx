"use client";

import { PerspectiveCamera, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import texturePack from "./assets/texture-pack.png";
import {
  createTunnelParticleSortBuffers,
  sortTunnelParticlesBackToFront,
} from "./lib/sort-tunnel-particles";
import { configureTunnelTextureAtlas, TUNNEL_CAMERA_FOV } from "./lib/tunnel-colors";
import {
  buildTunnelParticlesGeometry,
  TUNNEL_PARTICLES_DEFAULTS,
  type TunnelParticlesConfig,
} from "./lib/tunnel-particles";
import { createTunnelParticlesMaterial } from "./lib/tunnel-particles-material";
import { createTunnelCurve, getTunnelFrame } from "./lib/tunnel-path";

export const TUNNEL_SCENE_DEFAULTS = {
  speed: 0.05,
  lookAhead: 0.12,
  ...TUNNEL_PARTICLES_DEFAULTS,
} as const;

export type TunnelSceneProps = {
  speed?: number;
  lookAhead?: number;
  count?: number;
  tunnelRadius?: number;
  wallThickness?: number;
  size?: number;
};

const _lookAt = new THREE.Vector3();

export function TunnelScene({
  speed = TUNNEL_SCENE_DEFAULTS.speed,
  lookAhead = TUNNEL_SCENE_DEFAULTS.lookAhead,
  count = TUNNEL_SCENE_DEFAULTS.count,
  tunnelRadius = TUNNEL_SCENE_DEFAULTS.tunnelRadius,
  wallThickness = TUNNEL_SCENE_DEFAULTS.wallThickness,
  size = TUNNEL_SCENE_DEFAULTS.size,
}: TunnelSceneProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const pathTRef = useRef(0);
  const speedRef = useRef(speed);
  const lookAheadRef = useRef(lookAhead);
  const pixelRatio = useThree((state) => state.viewport.dpr);
  const textureAtlas = useTexture(texturePack.src);

  speedRef.current = speed;
  lookAheadRef.current = lookAhead;

  const curve = useMemo(() => createTunnelCurve(), []);

  const particleConfig = useMemo<TunnelParticlesConfig>(
    () => ({ count, tunnelRadius, wallThickness, size }),
    [count, tunnelRadius, wallThickness, size],
  );

  const geometry = useMemo(
    () => buildTunnelParticlesGeometry(particleConfig),
    [particleConfig],
  );

  const material = useMemo(
    () =>
      createTunnelParticlesMaterial(
        textureAtlas,
        size,
        pixelRatio * window.innerHeight,
      ),
    [textureAtlas, size, pixelRatio],
  );

  const sortBuffers = useMemo(
    () => createTunnelParticleSortBuffers(count),
    [count],
  );

  useEffect(() => {
    configureTunnelTextureAtlas(textureAtlas);
  }, [textureAtlas]);

  useEffect(() => {
    material.uniforms.scale.value = pixelRatio * window.innerHeight;
    material.uniforms.size.value = size;
    material.uniforms.textureAtlas.value = textureAtlas;
  }, [material, pixelRatio, size, textureAtlas]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    if (!camera) return;

    pathTRef.current = (pathTRef.current + speedRef.current * delta) % 1;

    const { position, tangent } = getTunnelFrame(curve, pathTRef.current);
    const lookT = (pathTRef.current + lookAheadRef.current) % 1;
    curve.getPointAt(lookT, _lookAt);

    camera.position.copy(position);
    camera.up.set(0, 1, 0);
    camera.lookAt(_lookAt);
    camera.position.addScaledVector(tangent, 0.15);

    sortTunnelParticlesBackToFront(geometry, camera.position, sortBuffers);
  });

  return (
    <>
      <color attach="background" args={["#050508"]} />
      <PerspectiveCamera
        ref={cameraRef}
        fov={TUNNEL_CAMERA_FOV}
        near={0.1}
        far={80}
        makeDefault
      />
      <points
        ref={pointsRef}
        geometry={geometry}
        material={material}
        frustumCulled={false}
      />
    </>
  );
}
