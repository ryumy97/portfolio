"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "../lab-page-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CVSubHeading } from "@/components/ui/typography";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import ImageBubbleCanvas from "./canvas";
import { IMAGE_BUBBLE_DEFAULTS } from "./lib/settings";
import blobImage1 from "../neighbor/neighbor1.png";
import blobImage2 from "../neighbor/neighbor2.png";
import blobImage3 from "../neighbor/neighbor3.png";
import pointerImage from "../neighbor/neighbor1.png";

const BLOB_IMAGES = [blobImage1, blobImage2, blobImage3];

const SIMULATION_CONTROLS = [
  { key: "gravity", label: "Gravity", min: 0, max: 20, step: 0.05 },
  { key: "spring", label: "Spring", min: 0, max: 2, step: 0.01 },
  { key: "damp", label: "Damp", min: 0.5, max: 1, step: 0.01 },
  {
    key: "constraintPasses",
    label: "Constraint passes",
    min: 1,
    max: 24,
    step: 1,
  },
] as const satisfies readonly LabNumericControlDef[];

const NEIGHBOR_CONTROLS = [
  {
    key: "neighborMinLengthRatio",
    label: "Min length",
    min: 0.5,
    max: 1,
    step: 0.01,
  },
  {
    key: "neighborMaxLengthRatio",
    label: "Max length",
    min: 1,
    max: 1.5,
    step: 0.01,
  },
  {
    key: "neighborCompressStrength",
    label: "Compress",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "neighborExtendStrength",
    label: "Extend",
    min: 0,
    max: 1,
    step: 0.01,
  },
] as const satisfies readonly LabNumericControlDef[];

const SKIP_ONE_CONTROLS = [
  {
    key: "skipOneMinLengthRatio",
    label: "Min length",
    min: 0.5,
    max: 1,
    step: 0.01,
  },
  {
    key: "skipOneMaxLengthRatio",
    label: "Max length",
    min: 1,
    max: 1.5,
    step: 0.01,
  },
  {
    key: "skipOneCompressStrength",
    label: "Compress",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "skipOneExtendStrength",
    label: "Extend",
    min: 0,
    max: 1,
    step: 0.01,
  },
] as const satisfies readonly LabNumericControlDef[];

const BRIDGE_CONTROLS = [
  {
    key: "bridgeMinLengthRatio",
    label: "Min length",
    min: 0.5,
    max: 1,
    step: 0.01,
  },
  {
    key: "bridgeMaxLengthRatio",
    label: "Max length",
    min: 1,
    max: 1.5,
    step: 0.01,
  },
  {
    key: "bridgeCompressStrength",
    label: "Compress",
    min: 0,
    max: 0.1,
    step: 0.001,
  },
  {
    key: "bridgeExtendStrength",
    label: "Extend",
    min: 0,
    max: 0.1,
    step: 0.001,
  },
] as const satisfies readonly LabNumericControlDef[];

const POINTER_CONTROLS = [
  {
    key: "pointerRadius",
    label: "Pointer radius",
    min: 16,
    max: 160,
    step: 2,
  },
  {
    key: "pointerLerp",
    label: "Ball lerp",
    min: 0.01,
    max: 1,
    step: 0.01,
  },
] as const satisfies readonly LabNumericControlDef[];

type SimulationControlKey = (typeof SIMULATION_CONTROLS)[number]["key"];
type NeighborControlKey = (typeof NEIGHBOR_CONTROLS)[number]["key"];
type SkipOneControlKey = (typeof SKIP_ONE_CONTROLS)[number]["key"];
type BridgeControlKey = (typeof BRIDGE_CONTROLS)[number]["key"];
type PointerControlKey = (typeof POINTER_CONTROLS)[number]["key"];
type ControlKey =
  | SimulationControlKey
  | NeighborControlKey
  | SkipOneControlKey
  | BridgeControlKey
  | PointerControlKey;

const PHRASE_LINE = (
  <>
    <span>
      Cogito
      <span>,</span>{" "}
    </span>
    <span>
      ergo sum
      <span>.</span>
    </span>
  </>
);

const BackgroundPhrase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const [lineCount, setLineCount] = useState(2);
  const lineKeys = useMemo(
    () => Array.from({ length: lineCount }, () => crypto.randomUUID()),
    [lineCount],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;

    const measure = () => {
      const containerHeight = container.getBoundingClientRect().height;
      const lineHeight = line.getBoundingClientRect().height;
      if (lineHeight <= 0) return;

      setLineCount(Math.max(2, Math.ceil(containerHeight / lineHeight) + 1));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute bottom-0 left-0 flex flex-col font-heading text-[15vw] font-bold leading-[0.8em] tracking-[-0.03em] md:text-[7vw]">
        {lineKeys.map((key, index) => (
          <p
            key={key}
            ref={index === 0 ? lineRef : undefined}
            className="flex flex-col gap-1 pb-[0.15em] md:block"
            lang="en"
          >
            {PHRASE_LINE}
          </p>
        ))}
      </div>
    </div>
  );
};

const Page = () => {
  const [isDebug, setIsDebug] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [values, setValues] = useState<Record<ControlKey, number>>({
    gravity: IMAGE_BUBBLE_DEFAULTS.gravity,
    spring: IMAGE_BUBBLE_DEFAULTS.spring,
    damp: IMAGE_BUBBLE_DEFAULTS.damp,
    constraintPasses: IMAGE_BUBBLE_DEFAULTS.constraintPasses,
    neighborMinLengthRatio: IMAGE_BUBBLE_DEFAULTS.neighborMinLengthRatio,
    neighborMaxLengthRatio: IMAGE_BUBBLE_DEFAULTS.neighborMaxLengthRatio,
    neighborCompressStrength: IMAGE_BUBBLE_DEFAULTS.neighborCompressStrength,
    neighborExtendStrength: IMAGE_BUBBLE_DEFAULTS.neighborExtendStrength,
    skipOneMinLengthRatio: IMAGE_BUBBLE_DEFAULTS.skipOneMinLengthRatio,
    skipOneMaxLengthRatio: IMAGE_BUBBLE_DEFAULTS.skipOneMaxLengthRatio,
    skipOneCompressStrength: IMAGE_BUBBLE_DEFAULTS.skipOneCompressStrength,
    skipOneExtendStrength: IMAGE_BUBBLE_DEFAULTS.skipOneExtendStrength,
    bridgeMinLengthRatio: IMAGE_BUBBLE_DEFAULTS.bridgeMinLengthRatio,
    bridgeMaxLengthRatio: IMAGE_BUBBLE_DEFAULTS.bridgeMaxLengthRatio,
    bridgeCompressStrength: IMAGE_BUBBLE_DEFAULTS.bridgeCompressStrength,
    bridgeExtendStrength: IMAGE_BUBBLE_DEFAULTS.bridgeExtendStrength,
    pointerRadius: IMAGE_BUBBLE_DEFAULTS.pointerRadius,
    pointerLerp: IMAGE_BUBBLE_DEFAULTS.pointerLerp,
  });

  return (
    <LabPageLayout
      title="Image Bubble"
      description="Soft-body blobs masked with portrait stills. Move the pointer ball to push them around."
      sidebar={
        <div className="flex flex-col gap-4">
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
          <CVSubHeading className="text-muted-foreground">
            Neighbor
          </CVSubHeading>
          <LabNumericControls
            controls={NEIGHBOR_CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          <CVSubHeading className="text-muted-foreground">
            Skip-one
          </CVSubHeading>
          <LabNumericControls
            controls={SKIP_ONE_CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          <CVSubHeading className="text-muted-foreground">Bridge</CVSubHeading>
          <LabNumericControls
            controls={BRIDGE_CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          <CVSubHeading className="text-muted-foreground">Pointer</CVSubHeading>
          <LabNumericControls
            controls={POINTER_CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Min/max length ratios are relative to each link&apos;s spawn length.
            Particle count is derived from each blob&apos;s radius.
          </p>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="image-bubble-debug"
              className="text-sm text-muted-foreground"
            >
              Debug
            </label>
            <Switch
              id="image-bubble-debug"
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
      <BackgroundPhrase />
      <ImageBubbleCanvas
        settings={values}
        isDebug={isDebug}
        resetKey={resetKey}
        blobImages={BLOB_IMAGES}
        pointerImage={pointerImage}
      />
    </LabPageLayout>
  );
};

export default Page;
