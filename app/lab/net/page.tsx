"use client";

import { useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CVSubHeading } from "@/components/ui/typography";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import { LabPageLayout } from "../lab-page-layout";
import NetCanvas from "./canvas";
import { NET_DEFAULTS } from "./lib/scene";

const SIMULATION_CONTROLS = [
  { key: "spring", label: "Spring", min: 0.1, max: 1, step: 0.01 },
  { key: "damp", label: "Damp", min: 0.9, max: 1, step: 0.005 },
  { key: "gravity", label: "Gravity", min: 0, max: 2, step: 0.05 },
  {
    key: "constraintPasses",
    label: "Constraint passes",
    min: 1,
    max: 16,
    step: 1,
  },
] as const satisfies readonly LabNumericControlDef[];

const GRID_CONTROLS = [
  { key: "cellSize", label: "Cell size", min: 16, max: 120, step: 2 },
] as const satisfies readonly LabNumericControlDef[];

type SimulationControlKey = (typeof SIMULATION_CONTROLS)[number]["key"];
type GridControlKey = (typeof GRID_CONTROLS)[number]["key"];
type ControlKey = SimulationControlKey | GridControlKey;

export default function NetPage() {
  const [isDebug, setIsDebug] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [values, setValues] = useState<Record<ControlKey, number>>({
    spring: NET_DEFAULTS.spring,
    damp: NET_DEFAULTS.damp,
    gravity: NET_DEFAULTS.gravity,
    constraintPasses: NET_DEFAULTS.constraintPasses,
    cellSize: NET_DEFAULTS.cellSize,
  });

  return (
    <LabPageLayout
      title="Net"
      description="A diamond chain-link mesh bounded by four cubic bezier anchor lines. Move the pointer to push the net; press and drag to cut links."
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
          <CVSubHeading className="text-muted-foreground">Grid</CVSubHeading>
          <LabNumericControls
            controls={GRID_CONTROLS}
            values={values}
            onValueChange={(key, value) =>
              setValues((current) => ({ ...current, [key]: value }))
            }
          />
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="net-debug"
              className="text-sm text-muted-foreground"
            >
              Debug
            </label>
            <Switch
              id="net-debug"
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
      <NetCanvas
        settings={{ ...NET_DEFAULTS, ...values }}
        isDebug={isDebug}
        resetKey={resetKey}
      />
    </LabPageLayout>
  );
}
