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
const MOTION_LERP_SPEED = 10;
const LINE_LENGTH = 4;
const LINES_START = CAROUSEL_RADIUS * 2 - IMAGE_WIDTH;
const LINES_END = CAROUSEL_RADIUS * 2 + IMAGE_WIDTH + LINE_LENGTH;
const ITEM_COUNT = CAROUSEL_IMAGE_SRCS.length;
const STEP_ANGLE = (Math.PI * 2) / ITEM_COUNT;
const ENLARGED_CAMERA_DISTANCE = 5;
const DETACH_THRESHOLD = 0.02;
export const LINES_RATIO = LINES_START / LINES_END;

const _targetWorld = new THREE.Vector3();
const _cameraDirection = new THREE.Vector3();
const _restWorldPosition = new THREE.Vector3();
const _restWorldQuaternion = new THREE.Quaternion();
const _restLocalMatrix = new THREE.Matrix4();
const _restLocalQuaternion = new THREE.Quaternion();
const _restLocalScale = new THREE.Vector3();
const _lookAtHelper = new THREE.Object3D();
const _targetQuaternion = new THREE.Quaternion();
const _slerpTargetQuaternion = new THREE.Quaternion();
const _zeroVector = new THREE.Vector3();

type OriginalTransform = {
  slot: {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  };
  pivot: {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  };
  mesh: {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  };
};

function expLerpFactor(speed: number, delta: number) {
  return 1 - Math.exp(-speed * delta);
}

function getRestWorldTransform(
  parent: THREE.Object3D,
  localPosition: THREE.Vector3,
  localRotation: THREE.Euler,
  targetPosition: THREE.Vector3,
  targetQuaternion: THREE.Quaternion,
) {
  _restLocalQuaternion.setFromEuler(localRotation);
  _restLocalScale.set(1, 1, 1);
  _restLocalMatrix.compose(
    localPosition,
    _restLocalQuaternion,
    _restLocalScale,
  );
  _restLocalMatrix.premultiply(parent.matrixWorld);
  targetPosition.setFromMatrixPosition(_restLocalMatrix);
  targetQuaternion.setFromRotationMatrix(_restLocalMatrix);
}

function getCameraFrontTransform(
  camera: THREE.Camera,
  targetPosition: THREE.Vector3,
  targetQuaternion: THREE.Quaternion,
) {
  camera.getWorldDirection(_cameraDirection);
  targetPosition
    .copy(camera.position)
    .addScaledVector(_cameraDirection, ENLARGED_CAMERA_DISTANCE);

  _lookAtHelper.position.copy(targetPosition);
  _lookAtHelper.lookAt(camera.position);
  targetQuaternion.copy(_lookAtHelper.quaternion);
}

function shortestIndexDelta(from: number, to: number, count: number) {
  const half = count / 2;
  let delta = to - from;
  if (delta > half) delta -= count;
  else if (delta < -half) delta += count;
  return delta;
}

function lerpAngleShortest(from: number, to: number, t: number) {
  let delta = to - from;
  delta = (((delta % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return from + delta * t;
}

function slerpQuaternionShortest(
  from: THREE.Quaternion,
  to: THREE.Quaternion,
  t: number,
  out: THREE.Quaternion,
) {
  if (from.dot(to) < 0) {
    _slerpTargetQuaternion.set(-to.x, -to.y, -to.z, -to.w);
    out.copy(from).slerp(_slerpTargetQuaternion, t);
    return;
  }

  out.copy(from).slerp(to, t);
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
  enlarged,
}: {
  texture: THREE.Texture;
  angle: number;
  width: number;
  radius: number;
  active: boolean;
  index: number;
  onSelect: (index: number) => void;
  enlarged: boolean;
}) {
  const image = texture.image as HTMLImageElement;
  const imageWidth = image.naturalWidth || image.width || 1;
  const imageHeight = image.naturalHeight || image.height || 1;
  const height = width * (imageHeight / imageWidth);

  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;

  const slotRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const carouselParentRef = useRef<THREE.Object3D | null>(null);
  const originalRef = useRef<OriginalTransform>({
    slot: {
      position: new THREE.Vector3(x, height / 2, z),
      rotation: new THREE.Euler(0, angle + Math.PI / 2, 0),
      scale: new THREE.Vector3(1, 1, 1),
    },
    pivot: {
      position: new THREE.Vector3(width / 2 - 0.3, -height / 2 + 0.3, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1.25, 1.25, 1.25),
    },
    mesh: {
      position: new THREE.Vector3(-width / 2, height / 2, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
    },
  });
  const isDetachedRef = useRef(false);
  const [hovered, setHovered] = useState(false);
  const { gl, camera, scene } = useThree();

  const restPosition = useRef(new THREE.Vector3(x, height / 2, z));
  const restRotation = useRef(new THREE.Euler(0, angle + Math.PI / 2, 0));

  restPosition.current.set(x, height / 2, z);
  restRotation.current.set(0, angle + Math.PI / 2, 0);

  useEffect(() => {
    const slot = slotRef.current;
    const pivot = pivotRef.current;
    const mesh = meshRef.current;
    if (!slot || !pivot || !mesh || !enlarged || isDetachedRef.current) return;

    carouselParentRef.current = slot.parent;

    // originalRef.current.slot.rotation.set(0, angle + Math.PI / 2, 0);

    scene.attach(slot);
    isDetachedRef.current = true;
  }, [enlarged, scene]);

  useFrame((_, delta) => {
    const slot = slotRef.current;
    const pivot = pivotRef.current;
    const mesh = meshRef.current;
    if (!slot || !pivot || !mesh) return;

    const t = expLerpFactor(MOTION_LERP_SPEED, delta);
    const pivotRestX = width / 2;
    const pivotRestY = -height / 2;

    if (isDetachedRef.current) {
      const carouselParent = carouselParentRef.current;
      const original = originalRef.current;
      if (!carouselParent || !original) return;

      carouselParent.updateWorldMatrix(true, false);
      getRestWorldTransform(
        carouselParent,
        original.slot.position,
        original.slot.rotation,
        _restWorldPosition,
        _restWorldQuaternion,
      );
      getCameraFrontTransform(camera, _targetWorld, _targetQuaternion);

      const targetPosition = enlarged ? _targetWorld : _restWorldPosition;
      const targetQuaternion = enlarged
        ? _targetQuaternion
        : _restWorldQuaternion;
      const targetPivotPosition = enlarged
        ? _zeroVector
        : original.pivot.position;
      const targetPivotScale = enlarged ? 1 : original.pivot.scale.x;
      const targetMeshPosition = enlarged
        ? _zeroVector
        : original.mesh.position;

      slot.position.lerp(targetPosition, t);
      slerpQuaternionShortest(
        slot.quaternion,
        targetQuaternion,
        t,
        slot.quaternion,
      );
      slot.renderOrder = enlarged ? 1 : 0;

      pivot.scale.set(
        lerp(pivot.scale.x, targetPivotScale, t),
        lerp(pivot.scale.y, targetPivotScale, t),
        lerp(pivot.scale.z, targetPivotScale, t),
      );
      pivot.position.set(
        lerp(pivot.position.x, targetPivotPosition.x, t),
        lerp(pivot.position.y, targetPivotPosition.y, t),
        lerp(pivot.position.z, targetPivotPosition.z, t),
      );
      pivot.rotation.x = lerpAngleShortest(
        pivot.rotation.x,
        enlarged ? 0 : original.pivot.rotation.x,
        t,
      );
      pivot.rotation.y = lerpAngleShortest(
        pivot.rotation.y,
        enlarged ? 0 : original.pivot.rotation.y,
        t,
      );
      pivot.rotation.z = lerpAngleShortest(
        pivot.rotation.z,
        enlarged ? 0 : original.pivot.rotation.z,
        t,
      );
      mesh.position.set(
        lerp(mesh.position.x, targetMeshPosition.x, t),
        lerp(mesh.position.y, targetMeshPosition.y, t),
        lerp(mesh.position.z, targetMeshPosition.z, t),
      );
      mesh.rotation.x = lerpAngleShortest(
        mesh.rotation.x,
        enlarged ? 0 : original.mesh.rotation.x,
        t,
      );
      mesh.rotation.y = lerpAngleShortest(
        mesh.rotation.y,
        enlarged ? 0 : original.mesh.rotation.y,
        t,
      );
      mesh.rotation.z = lerpAngleShortest(
        mesh.rotation.z,
        enlarged ? 0 : original.mesh.rotation.z,
        t,
      );

      if (
        !enlarged &&
        slot.position.distanceTo(_restWorldPosition) < DETACH_THRESHOLD
      ) {
        carouselParent.attach(slot);
        slot.position.copy(original.slot.position);
        slot.rotation.copy(original.slot.rotation);
        slot.scale.copy(original.slot.scale);
        pivot.position.copy(original.pivot.position);
        pivot.rotation.copy(original.pivot.rotation);
        pivot.scale.copy(original.pivot.scale);
        mesh.position.copy(original.mesh.position);
        mesh.rotation.copy(original.mesh.rotation);
        mesh.scale.copy(original.mesh.scale);
        isDetachedRef.current = false;
      }

      return;
    }

    slot.renderOrder = 0;

    const targetScale = active ? (hovered ? 1.25 : 1.2) : hovered ? 1.1 : 1;
    const targetPositionOffsetX = active && hovered ? -0.3 : 0;
    const targetPositionOffsetY = active && hovered ? 0.3 : 0;

    slot.position.lerp(restPosition.current, t);
    slot.rotation.x = lerpAngleShortest(
      slot.rotation.x,
      restRotation.current.x,
      t,
    );
    slot.rotation.y = lerpAngleShortest(
      slot.rotation.y,
      restRotation.current.y,
      t,
    );
    slot.rotation.z = lerpAngleShortest(
      slot.rotation.z,
      restRotation.current.z,
      t,
    );

    pivot.scale.set(
      lerp(pivot.scale.x, targetScale, t),
      lerp(pivot.scale.y, targetScale, t),
      lerp(pivot.scale.z, targetScale, t),
    );
    pivot.position.set(
      lerp(pivot.position.x, pivotRestX + targetPositionOffsetX, t),
      lerp(pivot.position.y, pivotRestY + targetPositionOffsetY, t),
      0,
    );
  });

  return (
    <group
      ref={slotRef}
      position={[x, height / 2, z]}
      rotation={[0, angle + Math.PI / 2, 0]}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: R3F raycast events bubble from child mesh */}
      <group
        ref={pivotRef}
        position={[width / 2, -height / 2, 0]}
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
          onSelect(index);
        }}
      >
        <mesh
          ref={meshRef}
          position={[-width / 2, height / 2, 0]}
          renderOrder={enlarged ? 1 : 0}
        >
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

export function DiscCarouselScene({
  onRegisterUnselect,
}: {
  onRegisterUnselect?: (unselect: (() => void) | null) => void;
} = {}) {
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
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);
  const enlargedIndexRef = useRef<number | null>(null);
  enlargedIndexRef.current = enlargedIndex;

  const syncActiveIndex = useCallback(() => {
    const index =
      ((Math.round(activeIndexRef.current) % ITEM_COUNT) + ITEM_COUNT) %
      ITEM_COUNT;
    setActiveIndex(index);
  }, []);

  const unselect = useCallback(() => {
    setEnlargedIndex(null);
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      if (enlargedIndexRef.current === index) {
        unselect();
        return;
      }

      activeIndexRef.current += shortestIndexDelta(
        activeIndexRef.current,
        index,
        ITEM_COUNT,
      );
      syncActiveIndex();
      setEnlargedIndex(index);
    },
    [syncActiveIndex, unselect],
  );

  useEffect(() => {
    onRegisterUnselect?.(unselect);
    return () => onRegisterUnselect?.(null);
  }, [onRegisterUnselect, unselect]);

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

      if (enlargedIndexRef.current !== null) unselect();
      activeIndexRef.current += stepped;
      pointerIndexAccumRef.current -= stepped;

      syncActiveIndex();
    };

    const handleWheel = (event: WheelEvent) => {
      if (enlargedIndexRef.current !== null) unselect();
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
  }, [gl, syncActiveIndex, unselect]);

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
              enlarged={index === enlargedIndex}
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
