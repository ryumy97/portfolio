"use client";

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import {
  CLIP_SURFACE_SCENE_DEFAULTS,
  ClipSurfaceScene,
} from "@/components/three/scene/clip-surface-scene";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import type { ClipDebugState } from "@/lib/three/clip-debug";

const NUMERIC_CONTROLS = [
  { key: "clipY", label: "Clip Y", min: -2, max: 2, step: 0.01 },
  { key: "wave1", label: "Wave 1", min: 0, max: 0.1, step: 0.001 },
  { key: "wave2", label: "Wave 2", min: 0, max: 0.1, step: 0.001 },
  { key: "wave3", label: "Wave 3", min: 0, max: 0.1, step: 0.001 },
  { key: "speed", label: "Speed", min: 0, max: 3, step: 0.01 },
] as const satisfies readonly LabNumericControlDef<keyof ClipDebugState>[];

export default function Page() {
  const [values, setValues] = useState({
    clipY: CLIP_SURFACE_SCENE_DEFAULTS.clipY,
    wave1: CLIP_SURFACE_SCENE_DEFAULTS.wave1,
    wave2: CLIP_SURFACE_SCENE_DEFAULTS.wave2,
    wave3: CLIP_SURFACE_SCENE_DEFAULTS.wave3,
    speed: CLIP_SURFACE_SCENE_DEFAULTS.speed,
    color: CLIP_SURFACE_SCENE_DEFAULTS.color,
  });

  return (
    <LabPageLayout
      title="Clip surface"
      description="Clip a shaded surface with an animated wave boundary. Slide the clip plane and layer multiple wave frequencies."
      sidebar={
        <>
          <LabNumericControls
            controls={NUMERIC_CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Color</span>
            <input
              type="color"
              value={values.color}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  color: event.target.value,
                }))
              }
              className="h-8 w-full cursor-pointer rounded border border-border bg-background"
            />
          </div>
        </>
      }
    >
      <Canvas className="absolute inset-0 h-full w-full" frameloop="always">
        <ClipSurfaceScene {...values} />
      </Canvas>
    </LabPageLayout>
  );
}
