export const radToDeg = (rad: number) => ((rad * 180) / Math.PI + 360) % 360;
export const degToRad = (deg: number) => ((deg * Math.PI) / 180 + Math.PI * 2) % (Math.PI * 2);

export const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  getDistance(point?: Point) {
    if (!point) {
      return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    return Math.sqrt((this.x - point.x) ** 2 + (this.y - point.y) ** 2);
  }

  getAngle(point?: Point) {
    if (!point) {
      return Math.atan2(this.y, this.x) + Math.PI / 2;
    }

    return Math.atan2(this.y - point.y, this.x - point.x) + Math.PI / 2;
  }

  getAngleDeg(point?: Point) {
    return radToDeg(this.getAngle(point));
  }

  normalize(point?: Point) {
    if (!point) {
      return new Point(this.x / this.getDistance(), this.y / this.getDistance());
    }

    return new Point(
      (this.x - point.x) / this.getDistance(point),
      (this.y - point.y) / this.getDistance(point)
    );
  }

  isInside({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
    return this.x > x && this.x < x + width && this.y > y && this.y < y + height;
  }
}
