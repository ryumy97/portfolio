import type { BoundaryLines } from "./boundary";
import type { Line } from "./line";
import type { Point } from "./line";

export type BoundaryEdge = keyof BoundaryLines;
export type LineHandleKind = "start" | "end" | "control1" | "control2";

const CORNER_PAIRS: Record<
  `${BoundaryEdge}-start` | `${BoundaryEdge}-end`,
  [BoundaryEdge, "start" | "end"]
> = {
  "top-start": ["left", "end"],
  "top-end": ["right", "start"],
  "right-start": ["top", "end"],
  "right-end": ["bottom", "start"],
  "bottom-start": ["right", "end"],
  "bottom-end": ["left", "start"],
  "left-start": ["bottom", "end"],
  "left-end": ["top", "start"],
};

export function setLineEnd(
  boundary: BoundaryLines,
  edge: BoundaryEdge,
  end: "start" | "end",
  point: Point,
) {
  const line = boundary[edge];
  if (end === "start") {
    line.setStart(point);
  } else {
    line.setEnd(point);
  }

  const pair = CORNER_PAIRS[`${edge}-${end}`];
  if (!pair) return;

  const [otherEdge, otherEnd] = pair;
  const otherLine = boundary[otherEdge];
  if (otherEnd === "start") {
    otherLine.setStart(point);
  } else {
    otherLine.setEnd(point);
  }
}

export class LineHandle {
  static readonly RADIUS = 10;
  static readonly FILL = "#f75d5d";

  constructor(
    readonly edge: BoundaryEdge,
    readonly kind: LineHandleKind,
  ) {}

  line(boundary: BoundaryLines): Line {
    return boundary[this.edge];
  }

  position(boundary: BoundaryLines): Point {
    const line = this.line(boundary);
    if (this.kind === "start") return line.start;
    if (this.kind === "end") return line.end;
    if (this.kind === "control1") return line.control1;
    return line.control2;
  }

  move(boundary: BoundaryLines, point: Point) {
    const line = this.line(boundary);

    if (this.kind === "control1") {
      line.setControl1(point);
      return;
    }

    if (this.kind === "control2") {
      line.setControl2(point);
      return;
    }

    setLineEnd(boundary, this.edge, this.kind, point);
  }

  contains(boundary: BoundaryLines, x: number, y: number) {
    const point = this.position(boundary);
    const dx = x - point.x;
    const dy = y - point.y;
    return dx * dx + dy * dy <= LineHandle.RADIUS ** 2;
  }

  draw(ctx: CanvasRenderingContext2D, boundary: BoundaryLines) {
    const { x, y } = this.position(boundary);

    ctx.beginPath();
    ctx.arc(x, y, LineHandle.RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = LineHandle.FILL;
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

const EDGES: readonly BoundaryEdge[] = ["top", "right", "bottom", "left"];
const KINDS: readonly LineHandleKind[] = [
  "start",
  "end",
  "control1",
  "control2",
];

export const LINE_HANDLES: readonly LineHandle[] = EDGES.flatMap((edge) =>
  KINDS.map((kind) => new LineHandle(edge, kind)),
);
