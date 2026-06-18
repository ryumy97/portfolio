"use client";

import { useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import {
  WEBGL_PIXELATION_DEFAULTS,
  WebGLPixelationCanvas,
} from "@/components/webgl/webgl-pixelation-canvas";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import image from "../neighbor/neighbor1.png";

const CONTROLS = [
  { key: "pixelSize", label: "Pixel size", min: 8, max: 128, step: 1 },
  { key: "radius", label: "Radius", min: 0, max: 1, step: 0.01 },
] as const satisfies readonly LabNumericControlDef[];

type ControlKey = (typeof CONTROLS)[number]["key"];

export default function Home() {
  const [values, setValues] = useState<Record<ControlKey, number>>({
    pixelSize: WEBGL_PIXELATION_DEFAULTS.pixelSize,
    radius: WEBGL_PIXELATION_DEFAULTS.radius,
  });

  return (
    <LabPageLayout
      title="Pixelation"
      description="Reveal a sharp image inside a soft pixelated mask that follows the pointer. Dial in block size and falloff."
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
      <WebGLPixelationCanvas
        className="absolute inset-0 h-full w-full"
        image={image}
        pixelSize={values.pixelSize}
        radius={values.radius}
      />
    </LabPageLayout>
  );
}
