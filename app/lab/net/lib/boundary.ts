import { Line, type Point } from "./line";

export type BoundaryLines = {
  top: Line;
  right: Line;
  bottom: Line;
  left: Line;
};

export type BoundaryMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type BoundaryCorners = {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerpPoint = (a: Point, b: Point, t: number): Point => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

export function boundaryFromMargins(
  width: number,
  height: number,
  margins: BoundaryMargins,
): BoundaryLines {
  const left = width * margins.left;
  const right = width * (1 - margins.right);
  const top = height * margins.top;
  const bottom = height * (1 - margins.bottom);

  return {
    top: new Line(left, top, right, top),
    right: new Line(right, top, right, bottom),
    bottom: new Line(right, bottom, left, bottom),
    left: new Line(left, bottom, left, top),
  };
}

export function boundaryCorners(boundary: BoundaryLines): BoundaryCorners {
  return {
    topLeft: boundary.top.start,
    topRight: boundary.top.end,
    bottomRight: boundary.bottom.start,
    bottomLeft: boundary.bottom.end,
  };
}

export function computeGridDimensions(
  boundary: BoundaryLines,
  cellSize: number,
) {
  const avgWidth = (boundary.top.length() + boundary.bottom.length()) * 0.5;
  const avgHeight = (boundary.left.length() + boundary.right.length()) * 0.5;

  const cols = Math.max(2, Math.round(avgWidth / cellSize + 0.5));
  const rows = Math.max(2, Math.floor(avgHeight / cellSize) + 1);

  return { cols, rows };
}

export function diamondNodePosition(
  col: number,
  row: number,
  cols: number,
  rows: number,
  boundary: BoundaryLines,
): Point {
  const span = cols - 1;
  const colT = cols > 1 ? col / span : 0;
  const zigzagT = row % 2 === 1 ? (col + 0.5) / span : colT;
  const rowT = rows > 1 ? row / (rows - 1) : 0;

  if (row === 0) {
    return boundary.top.pointAt(colT);
  }

  if (row === rows - 1) {
    return boundary.bottom.pointAt(cols > 1 ? 1 - colT : 0);
  }

  const left = boundary.left.pointAt(1 - rowT);
  const right = boundary.right.pointAt(rowT);
  return lerpPoint(left, right, zigzagT);
}

export function drawBoundary(
  ctx: CanvasRenderingContext2D,
  boundary: BoundaryLines,
) {
  for (const line of [
    boundary.top,
    boundary.right,
    boundary.bottom,
    boundary.left,
  ]) {
    line.draw(ctx);
  }
}

export { Line } from "./line";
