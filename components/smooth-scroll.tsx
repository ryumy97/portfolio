"use client";

import type { ScrollCallback } from "lenis";
import { Lenis as LenisComponent, type LenisRef, useLenis } from "lenis/react";
import { cancelFrame, frame } from "motion";
import { useEffect, useRef } from "react";
import { useMdUp } from "@/lib/use-md-up";
import { cn } from "@/lib/utils";

type Props = {
  horizontal?: boolean;
  onScroll?: ScrollCallback;
  children: React.ReactNode;
};

function SmoothScrollController({
  onScroll,
  children,
}: Pick<Props, "onScroll" | "children">) {
  useLenis(onScroll, onScroll ? [onScroll] : []);

  return children;
}

const SmoothScroll = ({ horizontal = false, onScroll, children }: Props) => {
  const lenisRef = useRef<LenisRef | null>(null);
  const mdUp = useMdUp();
  const horizontalActive = horizontal && mdUp;

  useEffect(() => {
    function update(data: { timestamp: number }) {
      const time = data.timestamp;
      lenisRef.current?.lenis?.raf(time);
    }

    frame.update(update, true);

    return () => cancelFrame(update);
  }, []);

  return (
    <LenisComponent
      key={horizontalActive ? "x" : "y"}
      ref={lenisRef}
      className={cn("h-svh w-screen relative", {
        "overflow-x-auto overflow-y-hidden": horizontalActive,
        "overflow-y-auto overflow-x-hidden": !horizontalActive,
      })}
      options={
        horizontalActive
          ? {
              autoRaf: false,
              orientation: "horizontal",
              gestureOrientation: "both",
              smoothWheel: true,
            }
          : {
              autoRaf: false,
              orientation: "vertical",
              smoothWheel: true,
            }
      }
    >
      <SmoothScrollController onScroll={onScroll}>
        {children}
      </SmoothScrollController>
    </LenisComponent>
  );
};

export function useScrollEvent(callback: ScrollCallback) {
  const lenis = useLenis();

  useEffect(() => {
    lenis?.on("scroll", callback);

    return () => {
      lenis?.off("scroll", callback);
    };
  }, [lenis, callback]);
}

export default SmoothScroll;
