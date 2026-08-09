"use client";

import { useState } from "react";
import { LabControlsGroup } from "@/app/lab/lab-controls-group";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  type StretchPaths,
  WEBGL_PIXEL_STRETCH_DEFAULTS,
  WebGLPixelStretchCanvas,
} from "@/components/webgl/webgl-pixel-stretch-canvas";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import cutout from "./assets/cutout.png";
import image from "./assets/image.png";

const EDGE_WAVE_CONTROLS = [
  {
    key: "edgeWaveStrength",
    label: "Strength",
    min: 0,
    max: 0.05,
    step: 0.001,
  },
  {
    key: "edgeWaveFrequency",
    label: "Frequency",
    min: 0,
    max: 3,
    step: 0.01,
  },
  {
    key: "edgeWaveCount",
    label: "Cycles",
    min: 0.5,
    max: 6,
    step: 0.1,
  },
] as const satisfies readonly LabNumericControlDef[];

type EdgeWaveKey = (typeof EDGE_WAVE_CONTROLS)[number]["key"];

function clonePaths(paths: StretchPaths): StretchPaths {
  return {
    a: { ...paths.a },
    a1: { ...paths.a1 },
    a2: { ...paths.a2 },
    b: { ...paths.b },
    c: { ...paths.c },
    c1: { ...paths.c1 },
    c2: { ...paths.c2 },
    d: { ...paths.d },
    ac1: { ...paths.ac1 },
    ac2: { ...paths.ac2 },
    bd1: { ...paths.bd1 },
    bd2: { ...paths.bd2 },
  };
}

const FALLBACK_PATHS = clonePaths(WEBGL_PIXEL_STRETCH_DEFAULTS.paths);

const DEFAULT_EDGE_WAVE = {
  edgeWaveStrength: WEBGL_PIXEL_STRETCH_DEFAULTS.edgeWaveStrength,
  edgeWaveFrequency: WEBGL_PIXEL_STRETCH_DEFAULTS.edgeWaveFrequency,
  edgeWaveCount: WEBGL_PIXEL_STRETCH_DEFAULTS.edgeWaveCount,
} satisfies Record<EdgeWaveKey, number>;

export default function PixelStretchPage() {
  const [paths, setPaths] = useState<StretchPaths>(FALLBACK_PATHS);
  const [revealKey, setRevealKey] = useState(0);
  const [showGuides, setShowGuides] = useState<boolean>(
    WEBGL_PIXEL_STRETCH_DEFAULTS.showGuides,
  );
  const [edgeWave, setEdgeWave] =
    useState<Record<EdgeWaveKey, number>>(DEFAULT_EDGE_WAVE);

  const handleReset = () => {
    setPaths(clonePaths(FALLBACK_PATHS));
    setEdgeWave(DEFAULT_EDGE_WAVE);
    setShowGuides(WEBGL_PIXEL_STRETCH_DEFAULTS.showGuides);
    setRevealKey((key) => key + 1);
  };

  return (
    <LabPageLayout
      title="Pixel Stretch"
      description="Cutout in front, Coons-patch stretch in the middle, full image behind."
      sidebar={
        <div className="flex flex-col gap-5 pt-2">
          <LabControlsGroup
            label="CD edge wave"
            controls={EDGE_WAVE_CONTROLS}
            values={edgeWave}
            onValueChange={(key, value) =>
              setEdgeWave((current) => ({ ...current, [key]: value }))
            }
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Handles & guides
            </span>
            <Switch checked={showGuides} onCheckedChange={setShowGuides} />
          </div>
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      }
    >
      <WebGLPixelStretchCanvas
        className="absolute inset-0 h-full w-full"
        image={image}
        cutout={cutout}
        paths={paths}
        onPathsChange={setPaths}
        showGuides={showGuides}
        imageWidth={WEBGL_PIXEL_STRETCH_DEFAULTS.imageWidth}
        edgeWaveStrength={edgeWave.edgeWaveStrength}
        edgeWaveFrequency={edgeWave.edgeWaveFrequency}
        edgeWaveCount={edgeWave.edgeWaveCount}
        revealKey={revealKey}
      />
    </LabPageLayout>
  );
}
