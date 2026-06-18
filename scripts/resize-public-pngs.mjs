#!/usr/bin/env node
/**
 * Process images under public/ and app/ (or extra paths):
 * - Resize PNGs wider than MAX_WIDTH (default 3840)
 * - Convert JPEG/JPG and HEIC/HEIF to PNG (EXIF orientation baked in), then resize PNG if needed
 * - Resize dimensions use displayed pixel size (meta.autoOrient), not raw EXIF buffer size
 *
 * Usage:
 *   node scripts/resize-public-pngs.mjs [--dry-run]
 *   node scripts/resize-public-pngs.mjs path/to/other [--dry-run]
 *   MAX_WIDTH=1920 node scripts/resize-public-pngs.mjs
 */

import { execFile } from "node:child_process";
import { readdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_DIRS = ["public", "app"];
const SKIP_DIR_NAMES = new Set(["node_modules", ".next", ".git"]);
const IMAGE_EXT = /\.(png|jpe?g|heic|heif)$/i;
const CONVERTIBLE_EXT = /\.(jpe?g|heic|heif)$/i;

const MAX_WIDTH = Number.parseInt(process.env.MAX_WIDTH ?? "3840", 10);
const dryRun = process.argv.includes("--dry-run");
const extraDirs = process.argv.slice(2).filter((arg) => arg !== "--dry-run");

if (!Number.isFinite(MAX_WIDTH) || MAX_WIDTH <= 0) {
	console.error("MAX_WIDTH must be a positive number.");
	process.exit(1);
}

const targetDirs =
	extraDirs.length > 0
		? extraDirs.map((dir) => path.resolve(process.cwd(), dir))
		: DEFAULT_DIRS.map((dir) => path.join(PROJECT_ROOT, dir));

function isConvertibleToPng(filePath) {
	return CONVERTIBLE_EXT.test(filePath);
}

function isHeic(filePath) {
	return /\.(heic|heif)$/i.test(filePath);
}

function pngPathFor(filePath) {
	return filePath.replace(/\.(jpe?g|heic|heif)$/i, ".png");
}

async function* walkImages(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.isDirectory() && SKIP_DIR_NAMES.has(entry.name)) continue;

		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walkImages(fullPath);
		} else if (entry.isFile() && IMAGE_EXT.test(entry.name)) {
			yield fullPath;
		}
	}
}

function formatSize(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function openImage(sourcePath, { applyExifOrientation = false } = {}) {
	return sharp(sourcePath, { autoOrient: applyExifOrientation });
}

/** Display-oriented width/height (accounts for EXIF orientation 5–8). */
function pixelSize(meta) {
	return {
		width: meta.autoOrient?.width ?? meta.width,
		height: meta.autoOrient?.height ?? meta.height,
	};
}

function resizeTarget(meta) {
	const { width, height } = pixelSize(meta);
	if (!width || !height) {
		return { needsResize: false, nextWidth: width, nextHeight: height };
	}

	const needsResize = width > MAX_WIDTH;
	const nextWidth = needsResize ? MAX_WIDTH : width;
	const nextHeight = needsResize
		? Math.round((height * nextWidth) / width)
		: height;

	return { needsResize, nextWidth, nextHeight };
}

async function convertHeicToPng(sourcePath, outPath) {
	const tempPath = `${outPath}.convert-tmp.png`;

	try {
		if (process.platform !== "darwin") {
			await openImage(sourcePath, { applyExifOrientation: true })
				.withMetadata({ orientation: 1 })
				.png({ compressionLevel: 9 })
				.toFile(outPath);
			return;
		}

		await execFileAsync("sips", [
			"-s",
			"format",
			"png",
			sourcePath,
			"--out",
			tempPath,
		]);

		await openImage(tempPath)
			.withMetadata({ orientation: 1 })
			.png({ compressionLevel: 9 })
			.toFile(outPath);
	} catch (error) {
		await unlink(outPath).catch(() => {});
		throw error;
	} finally {
		await unlink(tempPath).catch(() => {});
	}
}

async function convertToPng(
	sourcePath,
	outPath,
	{ applyExifOrientation = false } = {},
) {
	const tempPath = `${outPath}.convert-tmp.png`;

	try {
		await openImage(sourcePath, { applyExifOrientation })
			.withMetadata({ orientation: 1 })
			.png({ compressionLevel: 9 })
			.toFile(tempPath);
		await rename(tempPath, outPath);
	} catch (error) {
		await unlink(tempPath).catch(() => {});
		throw error;
	}
}

async function resizePng(filePath, targetSize) {
	const tempPath = `${filePath}.resize-tmp.png`;

	try {
		await openImage(filePath)
			.resize({
				width: targetSize.width,
				height: targetSize.height,
				fit: "inside",
				withoutEnlargement: true,
			})
			.withMetadata({ orientation: 1 })
			.png({ compressionLevel: 9 })
			.toFile(tempPath);
		await rename(tempPath, filePath);
	} catch (error) {
		await unlink(tempPath).catch(() => {});
		throw error;
	}
}

async function processPng(filePath) {
	const beforeStat = await stat(filePath);
	const meta = await openImage(filePath).metadata();
	const from = pixelSize(meta);
	const { needsResize, nextWidth, nextHeight } = resizeTarget(meta);

	if (!needsResize) {
		return {
			action: "skip",
			filePath,
			width: from.width,
			height: from.height,
		};
	}

	if (dryRun) {
		return {
			action: "would-resize",
			filePath,
			from,
			to: { width: nextWidth, height: nextHeight },
			size: beforeStat.size,
		};
	}

	await resizePng(filePath, {
		width: nextWidth,
		height: nextHeight,
	});

	const afterStat = await stat(filePath);
	const afterMeta = await openImage(filePath).metadata();
	const after = pixelSize(afterMeta);

	return {
		action: "resized",
		filePath,
		from,
		to: { width: after.width, height: after.height },
		sizeBefore: beforeStat.size,
		sizeAfter: afterStat.size,
	};
}

async function processConvertible(filePath) {
	const beforeStat = await stat(filePath);
	const meta = await openImage(filePath, {
		applyExifOrientation: true,
	}).metadata();
	const outPath = pngPathFor(filePath);
	const from = pixelSize(meta);
	const { needsResize, nextWidth, nextHeight } = resizeTarget(meta);

	const outExists = await stat(outPath).catch(() => null);
	if (outExists) {
		return {
			action: "skip",
			filePath,
			reason: `${path.basename(outPath)} already exists`,
		};
	}

	if (dryRun) {
		return {
			action: "would-convert",
			filePath,
			outPath,
			from,
			to: { width: nextWidth, height: nextHeight },
			resize: needsResize,
			size: beforeStat.size,
		};
	}

	if (isHeic(filePath)) {
		await convertHeicToPng(filePath, outPath);
	} else {
		await convertToPng(filePath, outPath, { applyExifOrientation: true });
	}
	await unlink(filePath);

	if (needsResize) {
		const pngMeta = await openImage(outPath).metadata();
		const target = resizeTarget(pngMeta);
		await resizePng(outPath, target);
	}

	const afterStat = await stat(outPath);
	const afterMeta = await openImage(outPath).metadata();
	const after = pixelSize(afterMeta);

	return {
		action: "converted",
		filePath,
		outPath,
		from,
		to: { width: after.width, height: after.height },
		resize: needsResize,
		sizeBefore: beforeStat.size,
		sizeAfter: afterStat.size,
	};
}

async function processImage(filePath) {
	if (isConvertibleToPng(filePath)) return processConvertible(filePath);
	return processPng(filePath);
}

function logResult(relative, result) {
	if (result.action === "skip") {
		const detail =
			result.reason ?? (result.width != null ? `${result.width}px wide` : "");
		console.log(`  skip  ${relative}${detail ? ` (${detail})` : ""}`);
		return "skipped";
	}

	const from = `${result.from.width}×${result.from.height}`;
	const to = `${result.to.width}×${result.to.height}`;
	const sizeNote =
		result.sizeBefore != null
			? ` · ${formatSize(result.sizeBefore)} → ${formatSize(result.sizeAfter)}`
			: result.size != null
				? ` · ${formatSize(result.size)}`
				: "";

	if (result.action === "would-convert") {
		const out = path.relative(PROJECT_ROOT, result.outPath);
		const resizeNote = result.resize ? " + resize" : "";
		console.log(
			`  plan  ${relative} → ${out}  ${from} → ${to}${resizeNote}${sizeNote}`,
		);
		return "converted";
	}

	if (result.action === "converted") {
		const out = path.relative(PROJECT_ROOT, result.outPath);
		const resizeNote = result.resize ? " + resize" : "";
		console.log(
			`  convert  ${relative} → ${out}  ${from} → ${to}${resizeNote}${sizeNote}`,
		);
		return "converted";
	}

	const prefix = result.action === "would-resize" ? "plan" : "done";
	console.log(`  ${prefix}  ${relative}  ${from} → ${to}${sizeNote}`);
	return "resized";
}

async function main() {
	const validDirs = [];

	for (const dir of targetDirs) {
		const dirStat = await stat(dir).catch(() => null);
		if (dirStat?.isDirectory()) {
			validDirs.push(dir);
		} else {
			console.warn(`Skipping missing directory: ${dir}`);
		}
	}

	if (validDirs.length === 0) {
		console.error("No directories to scan.");
		process.exit(1);
	}

	const label = validDirs
		.map((dir) => path.relative(PROJECT_ROOT, dir) || dir)
		.join(", ");

	console.log(
		`${dryRun ? "[dry-run] " : ""}Scanning ${label} (PNG resize + JPEG/HEIC→PNG, max width ${MAX_WIDTH}px)\n`,
	);

	let skipped = 0;
	let resized = 0;
	let converted = 0;

	for (const targetDir of validDirs) {
		for await (const filePath of walkImages(targetDir)) {
			const relative = path.relative(PROJECT_ROOT, filePath);
			const result = await processImage(filePath);
			const bucket = logResult(relative, result);

			if (bucket === "skipped") skipped += 1;
			else if (bucket === "resized") resized += 1;
			else if (bucket === "converted") converted += 1;
		}
	}

	console.log(
		`\n${converted} converted, ${resized} resized, ${skipped} skipped.`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
