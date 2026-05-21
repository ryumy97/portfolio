#!/usr/bin/env node
/**
 * Convert an SVG file to PNG.
 *
 * Usage:
 *   node scripts/svg-to-png.mjs <input.svg> [options]
 *   npm run svg-to-png -- <input.svg> [options]
 *
 * Options:
 *   -o, --output <path>   Output PNG path (default: same basename as input)
 *   --width <px>          Output width in pixels
 *   --height <px>         Output height in pixels
 *   --density <dpi>       Rasterization DPI for vector input (default: 144)
 */

import { access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

function printUsage() {
	console.error(`Usage: node scripts/svg-to-png.mjs <input.svg> [options]

Options:
  -o, --output <path>   Output PNG path (default: input with .png extension)
  --width <px>          Output width in pixels
  --height <px>         Output height in pixels
  --density <dpi>       Rasterization DPI (default: 144)`);
}

function parseArgs(argv) {
	const positional = [];
	let output;
	let width;
	let height;
	let density = 144;

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];

		if (arg === "-h" || arg === "--help") {
			printUsage();
			process.exit(0);
		}

		if (arg === "-o" || arg === "--output") {
			output = argv[i + 1];
			if (!output) {
				console.error("Missing value for --output");
				process.exit(1);
			}
			i += 1;
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

		if (arg === "--height") {
			height = Number.parseInt(argv[i + 1] ?? "", 10);
			if (!Number.isFinite(height) || height <= 0) {
				console.error("--height must be a positive number");
				process.exit(1);
			}
			i += 1;
			continue;
		}

		if (arg === "--density") {
			density = Number.parseInt(argv[i + 1] ?? "", 10);
			if (!Number.isFinite(density) || density <= 0) {
				console.error("--density must be a positive number");
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

	return { input: positional[0], output, width, height, density };
}

async function fileExists(filePath) {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function main() {
	const { input, output, width, height, density } = parseArgs(
		process.argv.slice(2),
	);

	if (!input) {
		printUsage();
		process.exit(1);
	}

	const inputPath = path.resolve(input);

	if (!(await fileExists(inputPath))) {
		console.error(`Input not found: ${inputPath}`);
		process.exit(1);
	}

	if (!inputPath.toLowerCase().endsWith(".svg")) {
		console.error("Input must be an .svg file");
		process.exit(1);
	}

	const outputPath = path.resolve(
		output ?? inputPath.replace(/\.svg$/i, ".png"),
	);

	let pipeline = sharp(inputPath, { density });

	if (width != null || height != null) {
		pipeline = pipeline.resize({
			width,
			height,
			fit: "inside",
			withoutEnlargement: false,
		});
	}

	await pipeline.png({ compressionLevel: 9 }).toFile(outputPath);

	const meta = await sharp(outputPath).metadata();
	const relativeIn = path.relative(process.cwd(), inputPath);
	const relativeOut = path.relative(process.cwd(), outputPath);

	console.log(
		`Wrote ${relativeOut} (${meta.width}×${meta.height}) from ${relativeIn}`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
