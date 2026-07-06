"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  AXIS_TILT_CAMERA_POSITION,
  applyAxisTiltToCamera,
} from "./lib/axis-tilt-camera";
import {
  advanceOrbitingParticles,
  buildTrajectoryTailGeometry,
  getRotationAxis,
  SPHERE_VORTEX_BACKGROUND,
  SPHERE_VORTEX_DEFAULTS,
  type SphereVortexConfig,
  sampleAngularSpeedFactors,
  sampleSphereSurface,
} from "./lib/sphere-particles";

const CAMERA_ROTATION: [number, number, number] = [0, 0, 0];

const FIXED_ORBIT_AXIS_TILT = SPHERE_VORTEX_DEFAULTS.axisTilt;

export type SphereVortexSceneProps = Partial<SphereVortexConfig>;

export function SphereVortexScene({
  count = SPHERE_VORTEX_DEFAULTS.count,
  radius = SPHERE_VORTEX_DEFAULTS.radius,
  angularSpeed = SPHERE_VORTEX_DEFAULTS.angularSpeed,
  particleSize = SPHERE_VORTEX_DEFAULTS.particleSize,
  lineWidth = SPHERE_VORTEX_DEFAULTS.lineWidth,
  axisTilt = SPHERE_VORTEX_DEFAULTS.axisTilt,
  particleColor = SPHERE_VORTEX_DEFAULTS.particleColor,
  lineColor = SPHERE_VORTEX_DEFAULTS.lineColor,
}: SphereVortexSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const tailMeshRef = useRef<THREE.Mesh>(null);
  const angularSpeedRef = useRef(angularSpeed);
  const axisTiltRef = useRef(axisTilt);
  const rotationAxisRef = useRef(new THREE.Vector3());
  const orbitStateRef = useRef<{
    initialParticlePositions: Float32Array;
    initialTailPositions: Float32Array | null;
    particleVertexRanges: Array<{ start: number; count: number } | null>;
    angles: Float32Array;
    angularSpeedFactors: Float32Array;
  } | null>(null);

  angularSpeedRef.current = angularSpeed;
  axisTiltRef.current = axisTilt;

  const { particleGeometry, tailGeometry } = useMemo(() => {
    if (count <= 0) {
      orbitStateRef.current = null;
      return { particleGeometry: null, tailGeometry: null };
    }

    const initialParticlePositions = sampleSphereSurface(count, radius);
    const angularSpeedFactors = sampleAngularSpeedFactors(count);
    const angles = new Float32Array(count);

    const particleBuffer = new THREE.BufferGeometry();
    particleBuffer.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(initialParticlePositions.slice(), 3),
    );

    const tailBuild = buildTrajectoryTailGeometry(
      initialParticlePositions,
      lineWidth,
    );

    orbitStateRef.current = {
      initialParticlePositions,
      initialTailPositions: tailBuild?.initialPositions ?? null,
      particleVertexRanges: tailBuild?.particleVertexRanges ?? [],
      angles,
      angularSpeedFactors,
    };

    return {
      particleGeometry: particleBuffer,
      tailGeometry: tailBuild?.geometry ?? null,
    };
  }, [count, radius, lineWidth]);

  useEffect(() => {
    const camera = cameraRef.current;
    if (camera) {
      applyAxisTiltToCamera(camera, axisTilt);
    }
  }, [axisTilt]);

  useEffect(() => {
    return () => {
      particleGeometry?.dispose();
      tailGeometry?.dispose();
    };
  }, [particleGeometry, tailGeometry]);

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    if (camera) {
      applyAxisTiltToCamera(camera, axisTiltRef.current);
    }

    const points = pointsRef.current;
    const orbitState = orbitStateRef.current;
    if (!points || !orbitState) return;

    const particlePositionAttr = points.geometry.getAttribute("position");
    if (!(particlePositionAttr instanceof THREE.BufferAttribute)) return;

    const tailPositionAttr =
      tailMeshRef.current?.geometry.getAttribute("position");

    const axis = getRotationAxis(
      FIXED_ORBIT_AXIS_TILT,
      rotationAxisRef.current,
    );
    advanceOrbitingParticles({
      particlePositions: particlePositionAttr.array as Float32Array,
      initialParticlePositions: orbitState.initialParticlePositions,
      tailPositions:
        tailPositionAttr instanceof THREE.BufferAttribute
          ? (tailPositionAttr.array as Float32Array)
          : null,
      initialTailPositions: orbitState.initialTailPositions,
      particleVertexRanges: orbitState.particleVertexRanges,
      angles: orbitState.angles,
      angularSpeedFactors: orbitState.angularSpeedFactors,
      angularSpeed: angularSpeedRef.current,
      axis,
      delta,
    });

    particlePositionAttr.needsUpdate = true;
    if (tailPositionAttr instanceof THREE.BufferAttribute) {
      tailPositionAttr.needsUpdate = true;
    }
  });

  return (
    <>
      <color attach="background" args={[SPHERE_VORTEX_BACKGROUND]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 2]} intensity={1.1} />
      <PerspectiveCamera
        ref={cameraRef}
        fov={36}
        position={AXIS_TILT_CAMERA_POSITION}
        rotation={CAMERA_ROTATION}
        makeDefault
      />

      <group ref={groupRef}>
        {tailGeometry ? (
          <mesh
            ref={tailMeshRef}
            frustumCulled={false}
            geometry={tailGeometry}
            renderOrder={2}
          >
            <meshBasicMaterial
              color={lineColor}
              transparent
              opacity={0.45}
              depthTest
              depthWrite
              side={THREE.DoubleSide}
            />
          </mesh>
        ) : null}

        {particleGeometry ? (
          <points
            ref={pointsRef}
            geometry={particleGeometry}
            frustumCulled={false}
            renderOrder={1}
          >
            <pointsMaterial
              color={particleColor}
              size={particleSize}
              sizeAttenuation
              depthTest
              depthWrite
              transparent
              opacity={0.92}
            />
          </points>
        ) : null}
      </group>
    </>
  );
}
