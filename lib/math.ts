/**
 * Linearly interpolates between a and b by factor t.
 * @param a The start value.
 * @param b The end value.
 * @param t Interpolation factor (typically between 0 and 1).
 * @returns Interpolated value.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
