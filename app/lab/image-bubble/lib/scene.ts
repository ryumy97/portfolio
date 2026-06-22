import { Blob, particleCountForBlobRadius } from "./blob";
import { collectParticleRefs, resolveParticleCollisions } from "./collisions";
import { jointConfigsFromSettings } from "./joint-config";
import { PointerBall, type PointerInput } from "./pointer";
import { IMAGE_BUBBLE_DEFAULTS, type ImageBubbleSettings } from "./settings";

export type SceneImages = {
  blobImages: HTMLImageElement[];
  pointerImage: HTMLImageElement | null;
};

export class Scene {
  blobs: Blob[] = [];
  pointerBall = new PointerBall();
  width = 0;
  height = 0;
  settings: ImageBubbleSettings;

  constructor(settings: ImageBubbleSettings = IMAGE_BUBBLE_DEFAULTS) {
    this.settings = { ...settings };
  }

  reset(width: number, height: number, settings?: ImageBubbleSettings) {
    if (settings) {
      this.settings = { ...settings };
    }

    this.width = width;
    this.height = height;
    this.pointerBall.x = width * 0.5;
    this.pointerBall.y = height * 0.5;

    const minLength = Math.min(width, height);
    const { spring, damp } = this.settings;
    const jointConfigs = jointConfigsFromSettings(this.settings);
    const particleRadius = minLength * 0.04;

    const spawnPositions = [
      { x: width * 0.2, y: height * 0.28, radius: minLength * 0.35 },
      { x: width * 0.72, y: height * 0.28, radius: minLength * 0.3 },
      { x: width * 0.5, y: height * 1, radius: minLength * 0.25 },
    ];

    this.blobs = spawnPositions.map(({ x, y, radius }) =>
      Blob.create(
        x,
        y,
        radius,
        particleCountForBlobRadius(radius, particleRadius),
        particleRadius,
        "#000000",
        spring,
        damp,
        jointConfigs,
      ),
    );
  }

  syncSettings(settings: ImageBubbleSettings) {
    this.settings = { ...settings };
    const jointConfigs = jointConfigsFromSettings(settings);

    for (const blob of this.blobs) {
      blob.syncSettings(settings.spring, settings.damp, jointConfigs);
    }
  }

  step(pointer: PointerInput) {
    const { gravity, constraintPasses, pointerRadius, pointerLerp } =
      this.settings;
    const particleRefs = collectParticleRefs(this.blobs);

    for (const blob of this.blobs) {
      blob.integrate(gravity);
    }

    for (let pass = constraintPasses; pass--; ) {
      for (const blob of this.blobs) {
        blob.solveSprings(1);
      }
      resolveParticleCollisions(particleRefs, 2);
    }

    resolveParticleCollisions(particleRefs, 4);

    for (const blob of this.blobs) {
      blob.constrain(0, 0, this.width, this.height);
    }

    if (pointer.active) {
      const { prevX, prevY } = this.pointerBall.step(pointer, pointerLerp);
      const { x, y } = this.pointerBall;

      for (const blob of this.blobs) {
        blob.pushFromPointerSweep(prevX, prevY, x, y, pointerRadius);
        blob.pushFromPointer(x, y, pointerRadius);
      }

      for (let pass = 3; pass--; ) {
        resolveParticleCollisions(particleRefs, 2);
        for (const blob of this.blobs) {
          blob.solveSprings(1);
        }
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    pointer: PointerInput,
    images?: SceneImages,
  ) {
    ctx.clearRect(0, 0, this.width, this.height);

    for (const [index, blob] of this.blobs.entries()) {
      const image = images?.blobImages[index];
      if (image) {
        blob.drawMaskedImage(ctx, image, this.width, this.height);
      } else {
        blob.draw(ctx);
      }
    }

    const pointerImage = images?.pointerImage;
    if (pointerImage) {
      this.pointerBall.drawMaskedImage(
        ctx,
        pointerImage,
        this.width,
        this.height,
        this.settings.pointerRadius,
        pointer.active,
      );
    } else {
      this.pointerBall.draw(ctx, this.settings.pointerRadius, pointer.active);
    }
  }

  drawDebug(ctx: CanvasRenderingContext2D) {
    for (const blob of this.blobs) {
      blob.drawDebug(ctx);
    }
  }
}

export function createScene(
  width: number,
  height: number,
  settings?: ImageBubbleSettings,
) {
  const scene = new Scene(settings);
  scene.reset(width, height);
  return scene;
}
