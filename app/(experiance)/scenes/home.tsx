import { Point } from '@/app/utils/math';
import { DARK_MODE, useMedia } from '@/app/utils/media';
import { CameraControls, MeshDistortMaterial, PerspectiveCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useSpring } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const HomeScene = () => {
  const isDark = useMedia(DARK_MODE, 'darkMode');

  const cameraControls = useRef<CameraControls>(null);

  const { cameraPosition, cameraLookAt, blobPosition } = useControls({
    cameraPosition: {
      value: [0, 10, 0],
      step: 0.1,
    },
    cameraLookAt: {
      value: [0, 0, 0],
      step: 0.1,
    },
    blobPosition: {
      value: [4, 0, 1],
      step: 0.1,
    },
  });

  const three = useThree();

  useEffect(() => {
    const controls = cameraControls.current;

    if (!controls) return;

    controls.setLookAt(
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      cameraLookAt[0],
      cameraLookAt[1],
      cameraLookAt[2],
      true
    );

    controls.touches.one = 0b0;
    controls.touches.two = 0b0;
    controls.touches.three = 0b0;

    controls.mouseButtons.left = 0b0;
    controls.mouseButtons.right = 0b0;
    controls.mouseButtons.wheel = 0b0;
    controls.mouseButtons.middle = 0b0;
  }, [three, cameraPosition, cameraLookAt]);

  const [isHovered, setIsHovered] = useState(false);

  const positionOffsetX = useSpring(0, {
    stiffness: 2000,
    damping: 100,
    mass: 10,
  });
  const positionOffsetZ = useSpring(0, {
    stiffness: 2000,
    damping: 100,
    mass: 10,
  });

  const meshRef = useRef<THREE.Mesh>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const distortRef = useRef<any>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (
      !distortRef.current ||
      !meshRef.current ||
      !ambientLightRef.current ||
      !pointLightRef.current
    )
      return;

    distortRef.current.distort = THREE.MathUtils.lerp(
      distortRef.current.distort,
      isHovered ? 0.6 : 0.4,
      0.1
    );

    distortRef.current.speed = THREE.MathUtils.lerp(
      distortRef.current.speed,
      isHovered ? 5 : 1,
      0.1
    );

    meshRef.current.scale.lerp(
      {
        x: 2,
        y: 2,
        z: 2,
      },
      0.1
    );

    meshRef.current.position.x = blobPosition[0] + positionOffsetX.get();
    meshRef.current.position.z = blobPosition[2] + positionOffsetZ.get();

    ambientLightRef.current.color.lerp(
      isHovered ? new THREE.Color(isDark ? '#71A7DC' : '#2E73B8') : new THREE.Color('#ffffff'),
      0.1
    );

    pointLightRef.current.position.lerp(
      {
        x: state.pointer.x * 5,
        y: state.pointer.y * 5,
        z: -5,
      },
      0.1
    );

    pointLightRef.current.intensity = THREE.MathUtils.lerp(
      pointLightRef.current.intensity,
      isDark ? 20 : 500,
      0.1
    );

    pointLightRef.current?.color.lerp(
      isDark ? new THREE.Color('#71A7DC') : new THREE.Color('#2E73B8'),
      0.1
    );
  });

  return (
    <>
      <CameraControls ref={cameraControls} />
      <PerspectiveCamera position={[0, 10, 0]} makeDefault>
        <ambientLight ref={ambientLightRef} intensity={1} />
        <ambientLight intensity={1} color={'white'} />
        <pointLight ref={pointLightRef} intensity={10} color="white"></pointLight>
      </PerspectiveCamera>

      <mesh
        ref={meshRef}
        position={blobPosition}
        scale={2}
        onPointerEnter={() => {
          setIsHovered(true);
        }}
        onPointerMove={(event) => {
          const point = new Point(event.point.x, event.point.z);
          const objectPoint = new Point(blobPosition[0], blobPosition[2]);

          const diff = point.getDistance(objectPoint);
          const norm = point.normalize(objectPoint);

          positionOffsetX.set((norm.x * diff) / 2);
          positionOffsetZ.set((norm.y * diff) / 2);
        }}
        onPointerLeave={() => {
          positionOffsetX.set(0);
          positionOffsetZ.set(0);

          setIsHovered(false);
        }}
        onPointerDown={() => {
          console.log('down');
        }}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          ref={distortRef}
          speed={1}
          color={isDark ? '#E4E9E5' : '#0B0E0C'}
          metalness={0.5}
          //   envMapIntensity={1}
          clearcoat={0}
          clearcoatRoughness={0.2}
        />
      </mesh>
    </>
  );
};

export default HomeScene;
