"use client";

import { useState } from "react";
import { LabControlsGroup } from "@/app/lab/lab-controls-group";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import { Switch } from "@/components/ui/switch";
import {
  WEBGL_THERMAL_BLUR_DEFAULTS,
  WebGLTextBlurCanvas,
} from "@/components/webgl/webgl-text-blur-canvas";

const THERMAL_BLUR_CONTROLS = [
  {
    key: "blur",
    label: "Blur strength",
    min: 0,
    max: 40,
    step: 1,
  },
  {
    key: "blurSoftness",
    label: "Blur softness",
    min: 0,
    max: 0.5,
    step: 0.01,
  },
  {
    key: "pointerRadius",
    label: "Pointer radius",
    min: 0.02,
    max: 0.35,
    step: 0.01,
  },
  {
    key: "pointerStrength",
    label: "Pointer strength",
    min: 0,
    max: 1,
    step: 0.01,
  },
] as const;

export default function TextBlurPage() {
  const [debug, setDebug] = useState(false);
  const [controls, setControls] = useState({
    blur: WEBGL_THERMAL_BLUR_DEFAULTS.blur,
    blurSoftness: WEBGL_THERMAL_BLUR_DEFAULTS.blurSoftness,
    pointerRadius: WEBGL_THERMAL_BLUR_DEFAULTS.pointerRadius,
    pointerStrength: WEBGL_THERMAL_BLUR_DEFAULTS.pointerStrength,
  });

  return (
    <LabPageLayout
      title="Thermal Blur"
      description="Move the pointer over the canvas to raise the noise map locally and reveal blurred thermal color sections."
      sidebar={
        <div className="flex flex-col gap-5 pt-2">
          <LabControlsGroup
            label="Interaction"
            controls={THERMAL_BLUR_CONTROLS}
            values={controls}
            onValueChange={(key, value) =>
              setControls((current) => ({
                ...current,
                [key]: value,
              }))
            }
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Debug passes</span>
            <Switch checked={debug} onCheckedChange={setDebug} />
          </div>
        </div>
      }
    >
      <WebGLTextBlurCanvas
        className="absolute inset-0 h-full w-full"
        debug={debug}
        blur={controls.blur}
        blurSoftness={controls.blurSoftness}
        pointerRadius={controls.pointerRadius}
        pointerStrength={controls.pointerStrength}
      />
    </LabPageLayout>
  );
}
