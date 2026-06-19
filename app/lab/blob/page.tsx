"use client";

import { useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CVSubHeading } from "@/components/ui/typography";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import pointerImage from "../neighbor/neighbor1.png";
import image1 from "../neighbor/neighbor1.png";
import image2 from "../neighbor/neighbor2.png";
import image3 from "../neighbor/neighbor3.png";
import BlobCanvas from "./blob-canvas";
import { ANATOMY_BLOB_DEFAULTS } from "./lib/anatomy-blob-engine";

const BLOB_IMAGES = [image1, image2, image3];

const SIMULATION_CONTROLS = [
  { key: "gravity", label: "Gravity", min: 0, max: 10, step: 0.05 },
  { key: "substeps", label: "Substeps", min: 1, max: 24, step: 1 },
  {
    key: "springStrength",
    label: "Spring strength",
    min: 0,
    max: 1,
    step: 0.01,
  },
  { key: "damping", label: "Damping", min: 0.5, max: 1, step: 0.01 },
  { key: "blobMass", label: "Blob mass", min: 0.01, max: 2, step: 0.01 },
  { key: "wallBounce", label: "Wall bounce", min: 0, max: 2, step: 0.05 },
] as const satisfies readonly LabNumericControlDef[];

const BLOB_CONTROLS = [
  { key: "blobSize", label: "Blob size", min: 0.1, max: 3, step: 0.05 },
  { key: "pointCount", label: "Point count", min: 12, max: 120, step: 4 },
  {
    key: "springNeighbors",
    label: "Spring neighbors",
    min: 1,
    max: 8,
    step: 1,
  },
] as const satisfies readonly LabNumericControlDef[];

const POINTER_CONTROLS = [
  { key: "pointerRadius", label: "Ball radius", min: 16, max: 200, step: 2 },
  { key: "pointerLerp", label: "Ball lerp", min: 0.01, max: 1, step: 0.01 },
  { key: "pointerPush", label: "Ball push", min: 0, max: 4, step: 0.05 },
  {
    key: "pointerTransfer",
    label: "Ball transfer",
    min: 0,
    max: 3,
    step: 0.05,
  },
] as const satisfies readonly LabNumericControlDef[];

type SimulationControlKey = (typeof SIMULATION_CONTROLS)[number]["key"];
type BlobControlKey = (typeof BLOB_CONTROLS)[number]["key"];
type PointerControlKey = (typeof POINTER_CONTROLS)[number]["key"];
type ControlKey = SimulationControlKey | BlobControlKey | PointerControlKey;

export default function BlobPage() {
  const [isDebug, setIsDebug] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [values, setValues] = useState<Record<ControlKey, number>>({
    gravity: ANATOMY_BLOB_DEFAULTS.gravity,
    substeps: ANATOMY_BLOB_DEFAULTS.substeps,
    springStrength: ANATOMY_BLOB_DEFAULTS.springStrength,
    damping: ANATOMY_BLOB_DEFAULTS.damping,
    blobMass: ANATOMY_BLOB_DEFAULTS.blobMass,
    wallBounce: ANATOMY_BLOB_DEFAULTS.wallBounce,
    blobSize: ANATOMY_BLOB_DEFAULTS.blobSize,
    pointCount: ANATOMY_BLOB_DEFAULTS.pointCount,
    springNeighbors: ANATOMY_BLOB_DEFAULTS.springNeighbors,
    pointerRadius: ANATOMY_BLOB_DEFAULTS.pointerRadius,
    pointerLerp: ANATOMY_BLOB_DEFAULTS.pointerLerp,
    pointerPush: ANATOMY_BLOB_DEFAULTS.pointerPush,
    pointerTransfer: ANATOMY_BLOB_DEFAULTS.pointerTransfer,
  });

  return (
    <LabPageLayout
      title="Blob"
      description="Soft-body blobs built with anatomy-style Verlet physics — spring networks, particle collisions, and gravity. Each blob masks a portrait while a rigid pointer ball pushes them around."
      sidebar={
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Tune simulation and pointer ball live. Change blob size, points, or
            spring neighbors then press Reset to rebuild the scene.
          </p>
          <CVSubHeading className="text-muted-foreground">
            Simulation
          </CVSubHeading>
          <LabNumericControls
            controls={SIMULATION_CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          <CVSubHeading className="text-muted-foreground">Blobs</CVSubHeading>
          <LabNumericControls
            controls={BLOB_CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          <CVSubHeading className="text-muted-foreground">
            Pointer ball
          </CVSubHeading>
          <LabNumericControls
            controls={POINTER_CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="blob-debug"
              className="text-sm text-muted-foreground"
            >
              Debug
            </label>
            <Switch
              id="blob-debug"
              checked={isDebug}
              onCheckedChange={setIsDebug}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setResetKey((key) => key + 1)}
          >
            Reset
          </Button>
        </div>
      }
    >
      <BlobCanvas
        images={BLOB_IMAGES}
        pointerImage={pointerImage}
        config={values}
        isDebug={isDebug}
        resetKey={resetKey}
      />
    </LabPageLayout>
  );
}
