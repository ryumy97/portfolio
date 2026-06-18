export function getScrollSegmentState(scroll: number, segmentCount: number) {
  const clamped = Math.max(0, Math.min(1, scroll));
  const scaled = clamped * segmentCount;
  const segment = Math.min(Math.floor(scaled), segmentCount - 1);
  const mix = scaled - segment;
  return { segment, mix };
}
