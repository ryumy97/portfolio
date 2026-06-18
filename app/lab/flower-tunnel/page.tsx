"use client";

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import { TUNNEL_SCENE_DEFAULTS, TunnelScene } from "./scene";

const CONTROLS = [
  { key: "speed", label: "Speed", min: 0, max: 0.2, step: 0.001 },
  { key: "lookAhead", label: "Look ahead", min: 0.01, max: 0.3, step: 0.001 },
  { key: "tunnelRadius", label: "Tunnel radius", min: 1, max: 4, step: 0.05 },
  {
    key: "wallThickness",
    label: "Wall thickness",
    min: 0.4,
    max: 3,
    step: 0.05,
  },
  { key: "size", label: "Particle size", min: 0.02, max: 0.6, step: 0.01 },
] as const satisfies readonly LabNumericControlDef[];

type ControlKey = (typeof CONTROLS)[number]["key"];

export default function FlowerTunnelPage() {
  const [values, setValues] = useState<Record<ControlKey, number>>({
    speed: TUNNEL_SCENE_DEFAULTS.speed,
    lookAhead: TUNNEL_SCENE_DEFAULTS.lookAhead,
    tunnelRadius: TUNNEL_SCENE_DEFAULTS.tunnelRadius,
    wallThickness: TUNNEL_SCENE_DEFAULTS.wallThickness,
    size: TUNNEL_SCENE_DEFAULTS.size,
  });

  return (
    <LabPageLayout
      title="Flower Tunnel"
      description="A looping pathway surrounded by flower particles. Four particle types each cycle through four distance-based textures from the texture atlas."
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
      <Canvas className="absolute inset-0 h-full w-full" frameloop="always">
        <TunnelScene {...values} />
      </Canvas>
    </LabPageLayout>
  );
}
