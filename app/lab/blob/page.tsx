"use client";

import { useState } from "react";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import pointerImage from "../neighbor/neighbor1.png";
import image1 from "../neighbor/neighbor1.png";
import image2 from "../neighbor/neighbor2.png";
import image3 from "../neighbor/neighbor3.png";
import BlobCanvas from "./blob-canvas";

const BLOB_IMAGES = [image1, image2, image3];

export default function BlobPage() {
  const [isDebug, setIsDebug] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  return (
    <LabPageLayout
      title="Blob"
      description="Soft-body blobs built with anatomy-style Verlet physics — spring networks, particle collisions, and gravity. Each blob masks a portrait while a rigid pointer ball pushes them around."
      sidebar={
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Blobs use circular loops with multi-spring constraints instead of
            letter shapes. Move the pointer to drive the rigid ball through the
            soft bodies.
          </p>
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
        isDebug={isDebug}
        resetKey={resetKey}
      />
    </LabPageLayout>
  );
}
