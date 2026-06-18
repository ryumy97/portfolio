"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { animate } from "motion";
import { useMotionValue } from "motion/react";
import type { StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import { Button } from "@/components/ui/button";
import {
  WEBGL_NEIGHBOR_DEFAULTS,
  WebGLNeighborCanvas,
} from "@/components/webgl/webgl-neighbor-canvas";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import image1 from "./neighbor1.png";
import image2 from "./neighbor2.png";
import image3 from "./neighbor3.png";

const NEIGHBOR_IMAGES: StaticImageData[] = [image1, image2, image3];

const CONTROLS = [
  { key: "pixelSize", label: "Pixel size", min: 4, max: 80, step: 1 },
  { key: "radius", label: "Radius", min: 0, max: 1, step: 0.01 },
] as const satisfies readonly LabNumericControlDef[];

type ControlKey = (typeof CONTROLS)[number]["key"];

export default function Home() {
  const progress = useMotionValue(0);
  const [progressState, setProgressState] = useState(0);
  const [values, setValues] = useState<Record<ControlKey, number>>({
    pixelSize: WEBGL_NEIGHBOR_DEFAULTS.pixelSize,
    radius: WEBGL_NEIGHBOR_DEFAULTS.radius,
  });

  useEffect(() => {
    animate(progress, progressState / (NEIGHBOR_IMAGES.length - 1), {
      duration: 1,
      ease: "easeInOut",
    });
  }, [progressState, progress]);

  return (
    <LabPageLayout
      title="Neighbor"
      description="Crossfade between portrait stills through a halftone field that reacts to pointer proximity."
      sidebar={
        <>
          <LabNumericControls
            controls={CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-xs text-muted-foreground">Image</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setProgressState((current) => current - 1)}
                disabled={progressState <= 0}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-8 text-center text-xs tabular-nums text-muted-foreground">
                {progressState + 1}/{NEIGHBOR_IMAGES.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setProgressState((current) => current + 1)}
                disabled={progressState >= NEIGHBOR_IMAGES.length - 1}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      }
    >
      <WebGLNeighborCanvas
        className="absolute inset-0 h-full w-full"
        images={NEIGHBOR_IMAGES}
        progress={progress}
        pixelSize={values.pixelSize}
        radius={values.radius}
      />
    </LabPageLayout>
  );
}
