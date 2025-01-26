'use client';

import { useEffect } from 'react';
import { motion, useSpring, useTransform, useVelocity } from 'motion/react';
import { clamp, lerp, Point } from '../utils/math';
import { create } from 'zustand';
import { safelyGetWindowWidth } from '../utils/media';

const useCursorStore = create<{
  isHovered: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}>(() => ({
  isHovered: false,
  x: 0,
  y: 0,
  width: 16,
  height: 16,
}));

export const useCursor = (ref: React.RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const onClick = (event: MouseEvent) => {
      useCursorStore.setState({
        isHovered: false,
        x: event.clientX,
        y: event.clientY,
        width: 8,
        height: 8,
      });

      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('click', onClick);

      el.click();
    };

    const mouseMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();

      const point = new Point(event.clientX, event.clientY);

      // const diffX = rect.x + rect.width / 2 - point.x;
      // const diffY = rect.y + rect.height / 2 - point.y;

      // useCursorStore.setState({
      //   x: rect.x - 4 - diffX / 3,
      //   y: rect.y - 4 - diffY / 3,
      //   width: rect.width + 8,
      //   height: rect.height + 8,
      // });

      if (
        !point.isInside({
          x: rect.x - 16,
          y: rect.y - 16,
          width: rect.width + 32,
          height: rect.height + 32,
        })
      ) {
        useCursorStore.setState({
          isHovered: false,
        });

        window.removeEventListener('mousemove', mouseMove);
        window.removeEventListener('click', onClick);
      }
    };

    const hover = () => {
      const rect = el.getBoundingClientRect();

      useCursorStore.setState({
        isHovered: true,
        x: rect.x - 4,
        y: rect.y - 4,
        width: rect.width + 8,
        height: rect.height + 8,
      });

      window.addEventListener('mousemove', mouseMove);
      window.addEventListener('click', onClick);
    };

    el.addEventListener('mouseenter', hover);

    return () => {
      el.removeEventListener('mouseenter', hover);
    };
  }, [ref]);
};

const Cursor = () => {
  const cursor = useCursorStore();

  const x = useSpring(0, { stiffness: 1000, damping: 100 });
  const y = useSpring(0, { stiffness: 1000, damping: 100 });
  const width = useSpring(0, { stiffness: 2000, damping: 200 });
  const height = useSpring(0, { stiffness: 2000, damping: 200 });
  const rotateZ = useSpring(0, { stiffness: 500, damping: 20, mass: 1 });

  const vX = useVelocity(x);
  const vY = useVelocity(y);
  const scale = useTransform(() => {
    const distance = new Point(vX.get(), vY.get()).getDistance(new Point(0, 0));

    return lerp(1, 0.5, clamp(distance / (safelyGetWindowWidth() || 1), 0, 1));
  });

  useEffect(() => {
    if (cursor.isHovered) {
      x.set(cursor.x + cursor.width / 2);
      y.set(cursor.y + cursor.height / 2);
      width.set(cursor.width);
      height.set(cursor.height);
      rotateZ.set(0);

      return;
    }

    x.set(cursor.x);
    y.set(cursor.y);
    width.set(8);
    height.set(8);
    rotateZ.set(45);

    const handleMouseMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      width.set(8);
      height.set(8);
      rotateZ.set(45);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [x, y, cursor, width, height, rotateZ]);

  return (
    <motion.div
      className="&:hover:hidden pointer-events-none fixed top-0 left-0 z-40 mix-blend-difference"
      style={{ x, y, rotateZ, scale }}
    >
      <motion.div
        className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white"
        style={{ width, height }}
      >
        <div className="absolute top-1/2 left-1/2 h-[1px] w-[1px] -translate-x-1/2 -translate-y-1/2"></div>
      </motion.div>
    </motion.div>
  );
};

export default Cursor;
