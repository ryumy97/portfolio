#!/usr/bin/env node
/**
 * Resize PNGs under public/ whose width exceeds MAX_WIDTH (default 3840).
 * Overwrites files in place. Use --dry-run to preview without writing.
 */

import { readdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const MAX_WIDTH = Number.parseInt(process.env.MAX_WIDTH ?? "3840", 10);
const dryRun = process.argv.includes("--dry-run");

if (!Number.isFinite(MAX_WIDTH) || MAX_WIDTH <= 0) {
	console.error("MAX_WIDTH must be a positive number.");
	process.exit(1);
}

async function* walkPngs(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walkPngs(fullPath);
		} else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
			yield fullPath;
		}
	}
}

function formatSize(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function resizeIfNeeded(filePath) {
	const beforeStat = await stat(filePath);
	const meta = await sharp(filePath).metadata();

	if (!meta.width || meta.width <= MAX_WIDTH) {
		return {
			action: "skip",
			filePath,
			width: meta.width,
			height: meta.height,
		};
	}

	const nextWidth = MAX_WIDTH;
	const nextHeight = meta.height
		? Math.round((meta.height * nextWidth) / meta.width)
		: undefined;

	if (dryRun) {
		return {
			action: "would-resize",
			filePath,
			from: { width: meta.width, height: meta.height },
			to: { width: nextWidth, height: nextHeight },
			size: beforeStat.size,
		};
	}

	const tempPath = `${filePath}.resize-tmp.png`;

	try {
		await sharp(filePath)
			.resize({
				width: nextWidth,
				withoutEnlargement: true,
			})
			.png({ compressionLevel: 9 })
			.toFile(tempPath);

		await rename(tempPath, filePath);

		const afterStat = await stat(filePath);
		const afterMeta = await sharp(filePath).metadata();

		return {
			action: "resized",
			filePath,
			from: { width: meta.width, height: meta.height },
			to: { width: afterMeta.width, height: afterMeta.height },
			sizeBefore: beforeStat.size,
			sizeAfter: afterStat.size,
		};
	} catch (error) {
		await unlink(tempPath).catch(() => {});
		throw error;
	}
}

async function main() {
	console.log(
		`${dryRun ? "[dry-run] " : ""}Scanning ${PUBLIC_DIR} (max width ${MAX_WIDTH}px)\n`,
	);

	let skipped = 0;
	let resized = 0;

	for await (const filePath of walkPngs(PUBLIC_DIR)) {
		const relative = path.relative(process.cwd(), filePath);
		const result = await resizeIfNeeded(filePath);

		if (result.action === "skip") {
			skipped += 1;
			console.log(`  skip  ${relative} (${result.width}px wide)`);
			continue;
		}

		resized += 1;
		const prefix = result.action === "would-resize" ? "plan" : "done";
		const from = `${result.from.width}×${result.from.height}`;
		const to = `${result.to.width}×${result.to.height}`;
		const sizeNote =
			result.sizeBefore != null
				? ` · ${formatSize(result.sizeBefore)} → ${formatSize(result.sizeAfter)}`
				: result.size != null
					? ` · ${formatSize(result.size)}`
					: "";
		console.log(`  ${prefix}  ${relative}  ${from} → ${to}${sizeNote}`);
	}

	console.log(`\n${resized} resized, ${skipped} already within limit.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
