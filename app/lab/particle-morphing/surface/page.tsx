"use client";

import { Canvas } from "@react-three/fiber";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import {
  SHAPE_SHIFT_CONTROLS,
  SHAPE_SHIFT_MOTION_CONTROLS,
  useShapeShiftController,
} from "./controller/use-shape-shift-controller";
import { ShapeShiftModelProvider } from "./model/use-shape-shift-model";
import { ShapeShiftSceneView } from "./view/shape-shift-scene";

export default function ShapeShiftPage() {
  const controller = useShapeShiftController();

  return (
    <LabPageLayout
      title="Surface Morph"
      description="3D model surfaces sampled into particles, morphing between forms in a loop. Orbit to inspect each shape."
      sidebar={
        <>
          <LabNumericControls
            controls={SHAPE_SHIFT_CONTROLS}
            values={controller.values}
            onValueChange={controller.setControlValue}
          />
          <LabNumericControls
            controls={SHAPE_SHIFT_MOTION_CONTROLS}
            values={controller.motion}
            onValueChange={controller.setMotionValue}
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Color</span>
            <input
              type="color"
              value={controller.color}
              onChange={(event) => controller.setColor(event.target.value)}
              className="h-8 w-full cursor-pointer rounded border border-border bg-background"
            />
          </div>
        </>
      }
    >
      <div
        ref={controller.setEventSource}
        className="absolute inset-0 h-full w-full"
      >
        <Canvas
          className="absolute inset-0 h-full w-full"
          eventSource={controller.eventSource ?? undefined}
          frameloop="always"
        >
          <ShapeShiftModelProvider count={controller.values.count}>
            {({ shapePositions }) => (
              <ShapeShiftSceneView
                shapePositions={shapePositions}
                shape={controller.shape}
                size={controller.values.size}
                color={controller.color}
                motion={controller.motion}
              />
            )}
          </ShapeShiftModelProvider>
        </Canvas>
      </div>
    </LabPageLayout>
  );
}
