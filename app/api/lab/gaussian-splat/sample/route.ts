import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const SAMPLE_SPLAT_PATH = path.join(
  process.cwd(),
  "app/lab/gaussian-splat/assets/sample.sog",
);

export async function GET() {
  const buffer = await readFile(SAMPLE_SPLAT_PATH);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
