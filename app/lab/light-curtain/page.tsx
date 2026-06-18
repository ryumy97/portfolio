"use client";

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import { LIGHT_CURTAIN_SCENE_DEFAULTS, LightCurtainScene } from "./scene";

const CONTROLS = [
  { key: "distortion", label: "Distortion", min: 0, max: 2, step: 0.001 },
  { key: "fill", label: "Fill", min: 0, max: 1, step: 0.01 },
  { key: "lightX", label: "Light X", min: -2, max: 2, step: 0.01 },
  { key: "lightY", label: "Light Y", min: -2, max: 2, step: 0.01 },
  { key: "lightZ", label: "Light Z", min: -2, max: 2, step: 0.01 },
] as const satisfies readonly LabNumericControlDef[];

type ControlKey = (typeof CONTROLS)[number]["key"];

export default function Home() {
  const [eventSource, setEventSource] = useState<HTMLDivElement | null>(null);
  const [values, setValues] = useState<Record<ControlKey, number>>({
    distortion: LIGHT_CURTAIN_SCENE_DEFAULTS.distortion,
    fill: LIGHT_CURTAIN_SCENE_DEFAULTS.fill,
    lightX: LIGHT_CURTAIN_SCENE_DEFAULTS.lightX,
    lightY: LIGHT_CURTAIN_SCENE_DEFAULTS.lightY,
    lightZ: LIGHT_CURTAIN_SCENE_DEFAULTS.lightZ,
  });

  return (
    <LabPageLayout
      title="Light curtain"
      description="A refractive light curtain in Three.js. Move the pointer to bend light and tune distortion, fill, and light position."
      sidebar={
        <LabNumericControls
          controls={CONTROLS}
          values={values}
          onValueChange={(key, value) =>
            setValues((current) => ({ ...current, [key]: value }))
          }
        />
      }
    >
      <div ref={setEventSource} className="absolute inset-0 h-full w-full">
        <Canvas
          className="absolute inset-0 h-full w-full"
          eventSource={eventSource ?? undefined}
          frameloop="always"
        >
          <color attach="background" args={["#ffffff"]} />
          <LightCurtainScene
            distortion={values.distortion}
            fill={values.fill}
            lightX={values.lightX}
            lightY={values.lightY}
            lightZ={values.lightZ}
          />
        </Canvas>
      </div>
    </LabPageLayout>
  );
}
