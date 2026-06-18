export function scheduleDraw(
  rafRef: { current: number },
  drawRef: { current: (() => void) | null },
) {
  cancelAnimationFrame(rafRef.current);
  rafRef.current = requestAnimationFrame(() => {
    drawRef.current?.();
  });
}

export function createScheduledDraw(drawRef: { current: (() => void) | null }) {
  const rafRef = { current: 0 };
  return () => scheduleDraw(rafRef, drawRef);
}
