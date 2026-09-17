#!/usr/bin/env node
/**
 * Convert .mov files to H.264 MP4 and looping animated WebP.
 *
 * Usage:
 *   node scripts/mov-to-mp4-webp.mjs [input.mov|dir ...]
 *   yarn convert-mov -- [input.mov]
 *
 * Defaults to scanning public/videos for .mov files.
 *
 * Options:
 *   --dry-run          Print planned outputs without converting
 *   --width <px>       Max output width (default 1280)
 *   --fps <n>          WebP frame rate (default 16)
 */

import { execFile } from "node:child_process";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_DIR = path.join(PROJECT_ROOT, "public", "videos");
const SKIP_DIR_NAMES = new Set(["node_modules", ".next", ".git"]);
const MOV_EXT = /\.mov$/i;

function printUsage() {
  console.error(`Usage: node scripts/mov-to-mp4-webp.mjs [input.mov|dir ...]

Options:
  --dry-run          Print planned outputs without converting
  --width <px>       Max output width (default 1280)
  --fps <n>          WebP frame rate (default 16)`);
}

function parseArgs(argv) {
  const positional = [];
  let dryRun = false;
  let width = 1280;
  let fps = 16;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--width") {
      width = Number.parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isFinite(width) || width <= 0) {
        console.error("--width must be a positive number");
        process.exit(1);
      }
      i += 1;
      continue;
    }
    if (arg === "--fps") {
      fps = Number.parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isFinite(fps) || fps <= 0) {
        console.error("--fps must be a positive number");
        process.exit(1);
      }
      i += 1;
      continue;
    }
    if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      printUsage();
      process.exit(1);
    }
    positional.push(arg);
  }

  return { positional, dryRun, width, fps };
}

async function commandExists(name) {
  try {
    await execFileAsync("which", [name]);
    return true;
  } catch {
    return false;
  }
}

async function* walkMovs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIR_NAMES.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMovs(fullPath);
    } else if (entry.isFile() && MOV_EXT.test(entry.name)) {
      yield fullPath;
    }
  }
}

async function collectInputs(positional) {
  const targets =
    positional.length > 0
      ? positional.map((item) => path.resolve(process.cwd(), item))
      : [DEFAULT_DIR];
  const files = [];

  for (const target of targets) {
    const info = await stat(target).catch(() => null);
    if (!info) {
      console.error(`Missing path: ${target}`);
      process.exit(1);
    }
    if (info.isDirectory()) {
      for await (const file of walkMovs(target)) files.push(file);
      continue;
    }
    if (!MOV_EXT.test(target)) {
      console.error(`Not a .mov file: ${target}`);
      process.exit(1);
    }
    files.push(target);
  }

  return files;
}

function scaleFilter(width) {
  return `scale='min(${width},iw)':-2:flags=lanczos`;
}

function outputsFor(movPath) {
  const parsed = path.parse(movPath);
  return {
    mp4: path.join(parsed.dir, `${parsed.name}.mp4`),
    webp: path.join(parsed.dir, `${parsed.name}.webp`),
  };
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function convertMp4(input, output, width) {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    input,
    "-an",
    "-vf",
    scaleFilter(width),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-crf",
    "20",
    "-preset",
    "medium",
    output,
  ]);
}

async function convertWebp(input, output, width, fps) {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "mov-webp-"));
  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      input,
      "-an",
      "-vf",
      `fps=${fps},${scaleFilter(width)}`,
      path.join(tmp, "%04d.png"),
    ]);
    const frames = (await readdir(tmp))
      .filter((file) => file.endsWith(".png"))
      .sort()
      .map((file) => path.join(tmp, file));
    if (frames.length === 0) {
      throw new Error("ffmpeg produced no WebP frames");
    }
    const delay = Math.round(1000 / fps);
    await execFileAsync("img2webp", [
      "-loop",
      "0",
      "-d",
      String(delay),
      "-mixed",
      "-q",
      "70",
      "-m",
      "4",
      ...frames,
      "-o",
      output,
    ]);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

async function convertFile(input, { dryRun, width, fps }) {
  const { mp4, webp } = outputsFor(input);
  const relative = path.relative(PROJECT_ROOT, input);
  if (dryRun) {
    console.log(
      `  plan  ${relative} → ${path.relative(PROJECT_ROOT, mp4)}, ${path.relative(PROJECT_ROOT, webp)}`,
    );
    return;
  }

  await convertMp4(input, mp4, width);
  await convertWebp(input, webp, width, fps);
  const [mp4Stat, webpStat] = await Promise.all([stat(mp4), stat(webp)]);
  console.log(
    `  done  ${relative} → ${path.basename(mp4)} ${formatSize(mp4Stat.size)}, ${path.basename(webp)} ${formatSize(webpStat.size)}`,
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const hasFfmpeg = await commandExists("ffmpeg");
  const hasImg2Webp = await commandExists("img2webp");
  if (!options.dryRun && (!hasFfmpeg || !hasImg2Webp)) {
    const missing = [
      !hasFfmpeg ? "ffmpeg" : null,
      !hasImg2Webp ? "img2webp" : null,
    ].filter(Boolean);
    console.error(`Missing ${missing.join(" and ")}.`);
    process.exit(1);
  }

  const files = await collectInputs(options.positional);
  if (files.length === 0) {
    console.log("No .mov files found.");
    return;
  }

  console.log(
    `${options.dryRun ? "[dry-run] " : ""}Converting ${files.length} mov file${files.length === 1 ? "" : "s"} (max width ${options.width}px, webp ${options.fps}fps)\n`,
  );

  for (const file of files) {
    await convertFile(file, options);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
