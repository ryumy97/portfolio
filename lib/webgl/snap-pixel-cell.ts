/**
 * Picks an integer cell size that divides `dimension` evenly and is closest to
 * `targetCellSize`, so the grid fills the canvas with no partial pixels.
 */
export function snapPixelCellSize(
  dimension: number,
  targetCellSize: number,
): number {
  if (dimension <= 0) return 1;

  const target = Math.max(1, targetCellSize);
  let bestCell = dimension;
  let bestDiff = Math.abs(dimension - target);

  const maxDivisor = Math.floor(Math.sqrt(dimension));
  for (let d = 1; d <= maxDivisor; d++) {
    if (dimension % d !== 0) continue;

    for (const cell of [d, dimension / d]) {
      const diff = Math.abs(cell - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestCell = cell;
      }
    }
  }

  return bestCell;
}
