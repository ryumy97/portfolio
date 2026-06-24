"use client";

import { Line, PerspectiveCamera, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { lerp } from "@/lib/math";
import { CAROUSEL_IMAGE_SRCS, CAROUSEL_IMAGES } from "./images";
import {
  createAngleLabelTexture,
  drawAngleLabel,
} from "./lib/angle-label-texture";
import { createRadialLinesTexture } from "./lib/line-texture";

const ANGLE_LABEL_WIDTH = 0.44;
const ANGLE_LABEL_HEIGHT = 0.22;
const ANGLE_LABEL_OFFSET = 0.9;

const IMAGE_WIDTH = 1.6;
const CAROUSEL_RADIUS = 2.5;
const DRAG_SENSITIVITY = 0.005;
const INDEX_LERP_SPEED = 10;
const LINE_LENGTH = 4;
const LINES_START = CAROUSEL_RADIUS * 2 - IMAGE_WIDTH;
const LINES_END = CAROUSEL_RADIUS * 2 + IMAGE_WIDTH + LINE_LENGTH;
const ITEM_COUNT = CAROUSEL_IMAGE_SRCS.length;
const STEP_ANGLE = (Math.PI * 2) / ITEM_COUNT;
export const LINES_RATIO = LINES_START / LINES_END;

function shortestIndexDelta(from: number, to: number, count: number) {
  const half = count / 2;
  let delta = to - from;
  if (delta > half) delta -= count;
  else if (delta < -half) delta += count;
  return delta;
}

function formatRotationDegrees(radians: number) {
  let degrees = THREE.MathUtils.radToDeg(radians) % 360;
  if (degrees < 0) degrees += 360;
  return `${degrees.toFixed(0)}°`;
}

function toDisplayIndex(index: number, count: number) {
  const wrapped = ((index % count) + count) % count;
  return wrapped + 1;
}

function formatIndexLabel(
  index: number,
  count: number,
  rotationRadians: number,
) {
  return `${toDisplayIndex(index, count)} · ${formatRotationDegrees(rotationRadians)}`;
}

function CarouselImage({
  texture,
  angle,
  width,
  radius,
  active,
  index,
  onSelect,
}: {
  texture: THREE.Texture;
  angle: number;
  width: number;
  radius: number;
  active: boolean;
  index: number;
  onSelect: (index: number) => void;
}) {
  const pivotRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { gl } = useThree();

  useFrame(() => {
    const targetScale = active ? (hovered ? 1.25 : 1.2) : hovered ? 1.1 : 1;
    const targetPositionOffsetX = active && hovered ? -0.3 : 0;
    const targetPositionOffsetY = active && hovered ? 0.3 : 0;

    const scaleX = pivotRef.current?.scale.x;
    const scaleY = pivotRef.current?.scale.y;
    const scaleZ = pivotRef.current?.scale.z;
    const positionX = pivotRef.current?.position.x;
    const positionY = pivotRef.current?.position.y;

    if (!scaleX || !scaleY || !scaleZ || !positionX || !positionY) return;

    pivotRef.current?.scale.set(
      lerp(scaleX, targetScale, 0.2),
      lerp(scaleY, targetScale, 0.2),
      lerp(scaleZ, targetScale, 0.2),
    );
    pivotRef.current?.position.set(
      lerp(positionX, width / 2 + targetPositionOffsetX, 0.2),
      lerp(positionY, -height / 2 + targetPositionOffsetY, 0.2),
      0,
    );
  });

  const image = texture.image as HTMLImageElement;
  const aspect = image.width / image.height;
  const height = width * aspect;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;

  return (
    <group position={[x, height / 2, z]} rotation={[0, angle + Math.PI / 2, 0]}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: R3F raycast events bubble from child mesh */}
      <group
        position={[width / 2, -height / 2, 0]}
        ref={pivotRef}
        onPointerEnter={(event) => {
          event.stopPropagation();
          setHovered(true);
          gl.domElement.style.cursor = "pointer";
        }}
        onPointerLeave={(event) => {
          event.stopPropagation();
          setHovered(false);
          gl.domElement.style.cursor = "auto";
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (!active) {
            onSelect(index);
            return;
          }
        }}
      >
        <mesh position={[-width / 2, height / 2, 0]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial
            map={texture}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

function CarouselLines({ lineTexture }: { lineTexture: THREE.CanvasTexture }) {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[LINES_END, LINES_END]} />
      <meshBasicMaterial
        map={lineTexture}
        side={THREE.DoubleSide}
        toneMapped={false}
        transparent
        color={0xff0000}
      />
    </mesh>
  );
}

function ReferenceLine({
  groupRef,
  activeIndexRef,
  itemCount,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  activeIndexRef: React.RefObject<number>;
  itemCount: number;
}) {
  const [labelTexture, setLabelTexture] = useState<THREE.CanvasTexture | null>(
    null,
  );
  const lastLabelRef = useRef("");

  useEffect(() => {
    const texture = createAngleLabelTexture();
    setLabelTexture(texture);

    return () => {
      texture.dispose();
    };
  }, []);

  useFrame(() => {
    if (!labelTexture || !groupRef.current) return;

    const text = formatIndexLabel(
      activeIndexRef.current,
      itemCount,
      Math.abs(Math.PI * 2 - groupRef.current.rotation.y),
    );
    if (text === lastLabelRef.current) return;

    lastLabelRef.current = text;
    drawAngleLabel(labelTexture, text);
  });

  return (
    <>
      <Line
        points={[
          [0, 0.001, LINES_START / 2],
          [0, 0, LINES_END],
        ]}
        color="#f75d5d"
        lineWidth={2}
        toneMapped={false}
      />
      {labelTexture && (
        <mesh
          position={[
            ANGLE_LABEL_HEIGHT / 2,
            0.02,
            LINES_END / 2 + ANGLE_LABEL_OFFSET,
          ]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        >
          <planeGeometry args={[ANGLE_LABEL_WIDTH, ANGLE_LABEL_HEIGHT]} />
          <meshBasicMaterial
            map={labelTexture}
            transparent
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  );
}

export function DiscCarouselScene() {
  const groupRef = useRef<THREE.Group>(null);
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const activeIndexRef = useRef(0);
  const realIndexRef = useRef(0);
  const pointerIndexAccumRef = useRef(0);

  const { gl, camera } = useThree();
  const textures = useTexture(CAROUSEL_IMAGE_SRCS, (textures) => {
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
    });
  });

  const [lineTexture, setLineTexture] = useState<THREE.CanvasTexture | null>(
    null,
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const syncActiveIndex = useCallback(() => {
    const index =
      ((Math.round(activeIndexRef.current) % ITEM_COUNT) + ITEM_COUNT) %
      ITEM_COUNT;
    setActiveIndex(index);
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      activeIndexRef.current += shortestIndexDelta(
        activeIndexRef.current,
        index,
        ITEM_COUNT,
      );
      syncActiveIndex();
    },
    [syncActiveIndex],
  );

  useEffect(() => {
    const texture = createRadialLinesTexture(CAROUSEL_IMAGES);
    setLineTexture(texture);

    return () => {
      texture.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (event: PointerEvent) => {
      isDraggingRef.current = true;
      lastPointerXRef.current = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerUp = (event: PointerEvent) => {
      isDraggingRef.current = false;
      canvas.releasePointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = event.clientX - lastPointerXRef.current;
      lastPointerXRef.current = event.clientX;

      pointerIndexAccumRef.current -= (deltaX * DRAG_SENSITIVITY) / STEP_ANGLE;
      const stepped = Math.trunc(pointerIndexAccumRef.current);
      if (stepped === 0) return;

      activeIndexRef.current += stepped;
      pointerIndexAccumRef.current -= stepped;

      syncActiveIndex();
    };

    const handleWheel = (event: WheelEvent) => {
      activeIndexRef.current -= Math.trunc(
        (event.deltaY * DRAG_SENSITIVITY) / STEP_ANGLE,
      );
      syncActiveIndex();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [gl, syncActiveIndex]);

  useFrame((_, delta) => {
    camera.lookAt(new THREE.Vector3());

    if (!groupRef.current) return;

    const t = 1 - Math.exp(-INDEX_LERP_SPEED * delta);
    realIndexRef.current = THREE.MathUtils.lerp(
      realIndexRef.current,
      activeIndexRef.current,
      t,
    );
    groupRef.current.rotation.y = -realIndexRef.current * STEP_ANGLE;
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 6, 5.5]} fov={42} />
      <color attach="background" args={["#ffffff"]} />
      <group rotation={[0, -Math.PI / 5, 0.1]} position={[2, 0, -3]}>
        <group ref={groupRef}>
          {textures.map((texture, index) => (
            <CarouselImage
              // biome-ignore lint/suspicious/noArrayIndexKey: it's okay
              key={index}
              texture={texture}
              angle={(index / textures.length) * Math.PI * 2}
              width={IMAGE_WIDTH}
              radius={CAROUSEL_RADIUS}
              active={index === activeIndex}
              index={index}
              onSelect={selectIndex}
            />
          ))}
          {lineTexture && <CarouselLines lineTexture={lineTexture} />}
        </group>
        <ReferenceLine
          groupRef={groupRef}
          activeIndexRef={activeIndexRef}
          itemCount={textures.length || ITEM_COUNT}
        />
      </group>
    </>
  );
}
