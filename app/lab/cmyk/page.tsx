"use client";

import { useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import {
  WEBGL_CMYK_DEFAULTS,
  WebGLCmykCanvas,
} from "@/components/webgl/webgl-cmyk-canvas";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import image from "../neighbor/neighbor1.png";

const CONTROLS = [
  { key: "pixelSize", label: "Pixel size", min: 2, max: 32, step: 1 },
  { key: "dotSize", label: "Dot size", min: 0.1, max: 1, step: 0.01 },
  { key: "cyanStrength", label: "Cyan strength", min: 0, max: 2, step: 0.01 },
  {
    key: "magentaStrength",
    label: "Magenta strength",
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: "yellowStrength",
    label: "Yellow strength",
    min: 0,
    max: 2,
    step: 0.01,
  },
  { key: "blackStrength", label: "Black strength", min: 0, max: 2, step: 0.01 },
  { key: "angleC", label: "Cyan angle", min: 0, max: 90, step: 1 },
  { key: "angleM", label: "Magenta angle", min: 0, max: 90, step: 1 },
  { key: "angleY", label: "Yellow angle", min: 0, max: 90, step: 1 },
  { key: "angleK", label: "Black angle", min: 0, max: 90, step: 1 },
] as const satisfies readonly LabNumericControlDef[];

type ControlKey = (typeof CONTROLS)[number]["key"];

export default function Home() {
  const [values, setValues] = useState<Record<ControlKey, number>>({
    pixelSize: WEBGL_CMYK_DEFAULTS.pixelSize,
    dotSize: WEBGL_CMYK_DEFAULTS.dotSize,
    cyanStrength: WEBGL_CMYK_DEFAULTS.cyanStrength,
    magentaStrength: WEBGL_CMYK_DEFAULTS.magentaStrength,
    yellowStrength: WEBGL_CMYK_DEFAULTS.yellowStrength,
    blackStrength: WEBGL_CMYK_DEFAULTS.blackStrength,
    angleC: WEBGL_CMYK_DEFAULTS.angleC,
    angleM: WEBGL_CMYK_DEFAULTS.angleM,
    angleY: WEBGL_CMYK_DEFAULTS.angleY,
    angleK: WEBGL_CMYK_DEFAULTS.angleK,
  });

  return (
    <LabPageLayout
      title="CMYK"
      description="Break an image into offset CMYK halftone plates. Adjust dot size, ink strength, and screen angles like print separations."
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
      <WebGLCmykCanvas
        className="absolute inset-0 h-full w-full"
        image={image}
        pixelSize={values.pixelSize}
        dotSize={values.dotSize}
        cyanStrength={values.cyanStrength}
        magentaStrength={values.magentaStrength}
        yellowStrength={values.yellowStrength}
        blackStrength={values.blackStrength}
        angleC={values.angleC}
        angleM={values.angleM}
        angleY={values.angleY}
        angleK={values.angleK}
      />
    </LabPageLayout>
  );
}
