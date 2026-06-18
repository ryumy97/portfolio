/** Coalesce invalidate() to one call per animation frame (for demand frameloop). */
export function createInvalidateScheduler(invalidate: () => void) {
  let frameId = 0;

  return () => {
    if (frameId) return;
    frameId = requestAnimationFrame(() => {
      frameId = 0;
      invalidate();
    });
  };
}
