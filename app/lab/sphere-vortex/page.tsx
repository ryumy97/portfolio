"use client";

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import { SPHERE_VORTEX_DEFAULTS } from "./lib/sphere-particles";
import { SphereVortexScene } from "./scene";

const CONTROLS = [
  { key: "count", label: "Count", min: 0, max: 200, step: 1 },
  {
    key: "particleSize",
    label: "Particle size",
    min: 0.01,
    max: 0.12,
    step: 0.005,
  },
  {
    key: "lineWidth",
    label: "Line width",
    min: 0.001,
    max: 0.01,
    step: 0.001,
  },
  { key: "angularSpeed", label: "Angular speed", min: 0, max: 4, step: 0.05 },
] as const satisfies readonly LabNumericControlDef[];

type ColorKey = "particleColor" | "lineColor";

const COLOR_CONTROLS = [
  { key: "particleColor", label: "Particles" },
  { key: "lineColor", label: "Lines" },
] as const satisfies readonly { key: ColorKey; label: string }[];

export default function SphereVortexPage() {
  const [values, setValues] = useState({
    count: SPHERE_VORTEX_DEFAULTS.count,
    particleSize: SPHERE_VORTEX_DEFAULTS.particleSize,
    lineWidth: SPHERE_VORTEX_DEFAULTS.lineWidth,
    angularSpeed: SPHERE_VORTEX_DEFAULTS.angularSpeed,
    particleColor: SPHERE_VORTEX_DEFAULTS.particleColor,
    lineColor: SPHERE_VORTEX_DEFAULTS.lineColor,
  });

  return (
    <LabPageLayout
      title="Sphere Vortex"
      description="Surface points sampled on a sphere, each orbiting at its own angular speed."
      sidebar={
        <>
          <LabNumericControls
            controls={CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          {COLOR_CONTROLS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <input
                type="color"
                value={values[key]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                className="h-8 w-full cursor-pointer rounded border border-border bg-background"
              />
            </div>
          ))}
        </>
      }
    >
      <Canvas className="absolute inset-0 h-full w-full" frameloop="always">
        <SphereVortexScene {...values} />
      </Canvas>
    </LabPageLayout>
  );
}
