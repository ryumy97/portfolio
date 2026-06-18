export interface ViewerMetadata {
  imageSize: [number, number];
  focalLength: number;
  colorSpace?: "sRGB" | "linearRGB";
  hasMetadata: boolean;
}

export function estimateFocalLength(imageSize: [number, number]): number {
  return imageSize[1] * 1.07;
}
