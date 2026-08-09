/**
 * One-shot: regenerate the transparent cutout PNG for the pixel-stretch lab.
 *
 * Requires: npm i -D @huggingface/transformers
 * Usage:    node scripts/generate-pixel-stretch-cutout.mjs
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AutoModel, AutoProcessor, RawImage } from "@huggingface/transformers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const inputPath = path.join(root, "app/lab/pixel-stretch/assets/image.png");
const outputPath = path.join(root, "app/lab/pixel-stretch/assets/cutout.png");
const MODEL_ID = "briaai/RMBG-1.4";

async function main() {
  console.log("Loading", MODEL_ID, "…");
  const model = await AutoModel.from_pretrained(MODEL_ID, {
    // @ts-expect-error custom arch
    config: { model_type: "custom" },
  });
  const processor = await AutoProcessor.from_pretrained(MODEL_ID);

  console.log("Reading", inputPath);
  const image = await RawImage.read(inputPath);
  const { pixel_values } = await processor(image);
  console.log("Running RMBG…");
  const { output } = await model({ input: pixel_values });

  const matteTensor = output[0].mul(255).to("uint8");
  const matte = await RawImage.fromTensor(matteTensor).resize(
    image.width,
    image.height,
  );
  const cutout = image.rgba().putAlpha(matte);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await cutout.save(outputPath);
  console.log("Wrote", outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
