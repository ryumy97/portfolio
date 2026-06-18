import { Matrix3, Matrix4 } from "three";

export type ColorSpace = "sRGB" | "linearRGB";

export interface PlyMetadata {
	extrinsics: Matrix4;
	intrinsics: Matrix3;
	imageSize: [number, number];
	focalLength: number;
	colorSpace: ColorSpace;
	hasMetadata: boolean;
}

const DEFAULT_METADATA: PlyMetadata = {
	extrinsics: new Matrix4(),
	intrinsics: new Matrix3(),
	imageSize: [640, 480],
	focalLength: 0,
	colorSpace: "sRGB",
	hasMetadata: false,
};

export function estimateFocalLength(imageSize: [number, number]): number {
	const height = imageSize[1];
	return height * 1.07;
}

interface PropertyInfo {
	name: string;
	type: string;
	byteSize: number;
}

interface ElementInfo {
	name: string;
	count: number;
	properties: PropertyInfo[];
	bytesPerElement: number;
}

function getPropertyByteSize(type: string): number {
	switch (type) {
		case "char":
		case "uchar":
		case "int8":
		case "uint8":
			return 1;
		case "short":
		case "ushort":
		case "int16":
		case "uint16":
			return 2;
		case "int":
		case "uint":
		case "int32":
		case "uint32":
		case "float":
		case "float32":
			return 4;
		case "double":
		case "float64":
			return 8;
		default:
			return 4;
	}
}

function parsePlyHeader(text: string): {
	headerEndIndex: number;
	elements: ElementInfo[];
	format: "binary_little_endian" | "binary_big_endian" | "ascii";
} {
	const lines = text.split("\n");
	const elements: ElementInfo[] = [];
	let currentElement: ElementInfo | null = null;
	let headerEndIndex = 0;
	let byteOffset = 0;
	let format: "binary_little_endian" | "binary_big_endian" | "ascii" = "ascii";

	for (const line of lines) {
		byteOffset += line.length + 1;

		const trimmed = line.trim();
		if (trimmed === "end_header") {
			headerEndIndex = byteOffset;
			break;
		}

		if (trimmed.startsWith("format ")) {
			const parts = trimmed.split(/\s+/);
			if (parts[1] === "binary_little_endian") {
				format = "binary_little_endian";
			} else if (parts[1] === "binary_big_endian") {
				format = "binary_big_endian";
			}
		} else if (trimmed.startsWith("element ")) {
			if (currentElement) {
				currentElement.bytesPerElement = currentElement.properties.reduce(
					(sum, p) => sum + p.byteSize,
					0,
				);
				elements.push(currentElement);
			}

			const parts = trimmed.split(/\s+/);
			if (parts.length >= 3 && parts[1]) {
				currentElement = {
					name: parts[1],
					count: Number.parseInt(parts[2] ?? "0", 10),
					properties: [],
					bytesPerElement: 0,
				};
			}
		} else if (trimmed.startsWith("property ") && currentElement) {
			const parts = trimmed.split(/\s+/);
			if (parts.length >= 3 && parts[1]) {
				const type = parts[1];
				const name = parts[parts.length - 1] ?? "";
				currentElement.properties.push({
					name,
					type,
					byteSize: getPropertyByteSize(type),
				});
			}
		}
	}

	if (currentElement) {
		currentElement.bytesPerElement = currentElement.properties.reduce(
			(sum, p) => sum + p.byteSize,
			0,
		);
		elements.push(currentElement);
	}

	return { headerEndIndex, elements, format };
}

function readFloats(
	view: DataView,
	offset: number,
	count: number,
	littleEndian: boolean,
): number[] {
	const result: number[] = [];
	for (let i = 0; i < count; i++) {
		result.push(view.getFloat32(offset + i * 4, littleEndian));
	}
	return result;
}

function readUints(
	view: DataView,
	offset: number,
	count: number,
	littleEndian: boolean,
): number[] {
	const result: number[] = [];
	for (let i = 0; i < count; i++) {
		result.push(view.getUint32(offset + i * 4, littleEndian));
	}
	return result;
}

export function parsePlyMetadata(buffer: ArrayBuffer): PlyMetadata {
	try {
		const decoder = new TextDecoder("utf-8");
		const headerBytes = new Uint8Array(buffer.slice(0, 10000));
		const headerText = decoder.decode(headerBytes);

		const { headerEndIndex, elements, format } = parsePlyHeader(headerText);

		if (format !== "binary_little_endian") {
			return { ...DEFAULT_METADATA };
		}

		const elementMap = new Map<string, ElementInfo>();
		for (const el of elements) {
			elementMap.set(el.name, el);
		}

		const hasIntrinsic =
			elementMap.has("intrinsic") || elementMap.has("supplement");
		const hasImageSize = elementMap.has("image_size");

		if (!hasIntrinsic && !hasImageSize) {
			return { ...DEFAULT_METADATA };
		}

		const view = new DataView(buffer);
		let offset = headerEndIndex;
		const elementOffsets = new Map<string, number>();

		for (const el of elements) {
			elementOffsets.set(el.name, offset);
			offset += el.count * el.bytesPerElement;
		}

		const metadata: PlyMetadata = {
			...DEFAULT_METADATA,
			hasMetadata: true,
		};

		const imageSizeEl = elementMap.get("image_size");
		if (imageSizeEl && imageSizeEl.count >= 1) {
			const imageSizeOffset = elementOffsets.get("image_size");
			if (imageSizeOffset !== undefined) {
				const values = readUints(view, imageSizeOffset, 2, true);
				if (values[0] !== undefined && values[1] !== undefined) {
					metadata.imageSize = [values[0], values[1]];
				}
			}
		}

		const intrinsicEl = elementMap.get("intrinsic");
		if (intrinsicEl && intrinsicEl.count >= 1) {
			const intrinsicOffset = elementOffsets.get("intrinsic");
			if (intrinsicOffset !== undefined) {
				if (intrinsicEl.count === 9) {
					const values = readFloats(view, intrinsicOffset, 9, true);
					const fx = values[0] ?? 512;
					const fy = values[4] ?? 512;
					metadata.focalLength = (fx + fy) / 2;
					metadata.intrinsics.set(
						values[0] ?? 1,
						values[1] ?? 0,
						values[2] ?? 0,
						values[3] ?? 0,
						values[4] ?? 1,
						values[5] ?? 0,
						values[6] ?? 0,
						values[7] ?? 0,
						values[8] ?? 1,
					);
				} else if (intrinsicEl.count === 4) {
					const values = readFloats(view, intrinsicOffset, 4, true);
					const fx = values[0] ?? 512;
					const fy = values[1] ?? 512;
					metadata.focalLength = (fx + fy) / 2;

					if (
						!imageSizeEl &&
						values[2] !== undefined &&
						values[3] !== undefined
					) {
						metadata.imageSize = [Math.round(values[2]), Math.round(values[3])];
					}
				}
			}
		}

		const extrinsicEl = elementMap.get("extrinsic");
		if (extrinsicEl && extrinsicEl.count >= 1) {
			const extrinsicOffset = elementOffsets.get("extrinsic");
			if (extrinsicOffset !== undefined) {
				if (extrinsicEl.count === 16) {
					const values = readFloats(view, extrinsicOffset, 16, true);
					metadata.extrinsics.set(
						values[0] ?? 1,
						values[4] ?? 0,
						values[8] ?? 0,
						values[12] ?? 0,
						values[1] ?? 0,
						values[5] ?? 1,
						values[9] ?? 0,
						values[13] ?? 0,
						values[2] ?? 0,
						values[6] ?? 0,
						values[10] ?? 1,
						values[14] ?? 0,
						values[3] ?? 0,
						values[7] ?? 0,
						values[11] ?? 0,
						values[15] ?? 1,
					);
				} else if (extrinsicEl.count === 12) {
					const values = readFloats(view, extrinsicOffset, 12, true);
					metadata.extrinsics.set(
						values[0] ?? 1,
						values[4] ?? 0,
						values[8] ?? 0,
						0,
						values[1] ?? 0,
						values[5] ?? 1,
						values[9] ?? 0,
						0,
						values[2] ?? 0,
						values[6] ?? 0,
						values[10] ?? 1,
						0,
						values[3] ?? 0,
						values[7] ?? 0,
						values[11] ?? 0,
						1,
					);
				}
			}
		}

		const colorSpaceEl = elementMap.get("color_space");
		if (colorSpaceEl && colorSpaceEl.count >= 1) {
			const colorSpaceOffset = elementOffsets.get("color_space");
			if (colorSpaceOffset !== undefined) {
				const value = view.getUint8(colorSpaceOffset);
				metadata.colorSpace = value === 0 ? "linearRGB" : "sRGB";
			}
		}

		return metadata;
	} catch {
		return { ...DEFAULT_METADATA };
	}
}

export function extractPlyPositions(buffer: ArrayBuffer): Float32Array {
	try {
		const decoder = new TextDecoder("utf-8");
		const headerBytes = new Uint8Array(buffer.slice(0, 10000));
		const headerText = decoder.decode(headerBytes);

		const { headerEndIndex, elements, format } = parsePlyHeader(headerText);

		if (format !== "binary_little_endian") {
			return new Float32Array(0);
		}

		const vertexElement = elements.find((el) => el.name === "vertex");
		if (!vertexElement) {
			return new Float32Array(0);
		}

		let xOffset = -1;
		let yOffset = -1;
		let zOffset = -1;
		let currentOffset = 0;

		for (const prop of vertexElement.properties) {
			if (prop.name === "x") xOffset = currentOffset;
			else if (prop.name === "y") yOffset = currentOffset;
			else if (prop.name === "z") zOffset = currentOffset;
			currentOffset += prop.byteSize;
		}

		if (xOffset < 0 || yOffset < 0 || zOffset < 0) {
			return new Float32Array(0);
		}

		let dataOffset = headerEndIndex;
		for (const el of elements) {
			if (el.name === "vertex") break;
			dataOffset += el.count * el.bytesPerElement;
		}

		const view = new DataView(buffer);
		const positions = new Float32Array(vertexElement.count * 3);
		const bytesPerVertex = vertexElement.bytesPerElement;

		for (let i = 0; i < vertexElement.count; i++) {
			const vertexOffset = dataOffset + i * bytesPerVertex;
			positions[i * 3] = view.getFloat32(vertexOffset + xOffset, true);
			positions[i * 3 + 1] = view.getFloat32(vertexOffset + yOffset, true);
			positions[i * 3 + 2] = view.getFloat32(vertexOffset + zOffset, true);
		}

		return positions;
	} catch {
		return new Float32Array(0);
	}
}
