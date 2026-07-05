export type Point = { x: number; y: number };

const distance = (a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (dx * dx + dy * dy) ** 0.5;
};

const defaultControls = (x1: number, y1: number, x2: number, y2: number) => ({
  c1x: x1 + (x2 - x1) / 3,
  c1y: y1 + (y2 - y1) / 3,
  c2x: x1 + (2 * (x2 - x1)) / 3,
  c2y: y1 + (2 * (y2 - y1)) / 3,
});

export class Line {
  x1: number;
  y1: number;
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  x2: number;
  y2: number;

  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    c1x?: number,
    c1y?: number,
    c2x?: number,
    c2y?: number,
  ) {
    const defaults = defaultControls(x1, y1, x2, y2);
    this.x1 = x1;
    this.y1 = y1;
    this.c1x = c1x ?? defaults.c1x;
    this.c1y = c1y ?? defaults.c1y;
    this.c2x = c2x ?? defaults.c2x;
    this.c2y = c2y ?? defaults.c2y;
    this.x2 = x2;
    this.y2 = y2;
  }

  get start(): Point {
    return { x: this.x1, y: this.y1 };
  }

  get control1(): Point {
    return { x: this.c1x, y: this.c1y };
  }

  get control2(): Point {
    return { x: this.c2x, y: this.c2y };
  }

  get end(): Point {
    return { x: this.x2, y: this.y2 };
  }

  setStart(point: Point) {
    this.x1 = point.x;
    this.y1 = point.y;
  }

  setControl1(point: Point) {
    this.c1x = point.x;
    this.c1y = point.y;
  }

  setControl2(point: Point) {
    this.c2x = point.x;
    this.c2y = point.y;
  }

  setEnd(point: Point) {
    this.x2 = point.x;
    this.y2 = point.y;
  }

  pointAt(t: number): Point {
    const u = 1 - t;
    const uu = u * u;
    const uuu = uu * u;
    const tt = t * t;
    const ttt = tt * t;

    return {
      x:
        uuu * this.x1 +
        3 * uu * t * this.c1x +
        3 * u * tt * this.c2x +
        ttt * this.x2,
      y:
        uuu * this.y1 +
        3 * uu * t * this.c1y +
        3 * u * tt * this.c2y +
        ttt * this.y2,
    };
  }

  approximateLength(samples = 20) {
    let length = 0;
    let previous = this.start;

    for (let index = 1; index <= samples; index++) {
      const point = this.pointAt(index / samples);
      length += distance(previous, point);
      previous = point;
    }

    return length;
  }

  length() {
    return this.approximateLength();
  }

  draw(
    ctx: CanvasRenderingContext2D,
    strokeStyle = "rgba(34, 197, 94, 0.45)",
    lineWidth = 1,
  ) {
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.bezierCurveTo(this.c1x, this.c1y, this.c2x, this.c2y, this.x2, this.y2);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}
