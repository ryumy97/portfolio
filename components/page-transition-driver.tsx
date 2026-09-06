"use client";

import {
  AnimatePresence,
  cubicBezier,
  motion,
  useReducedMotion,
} from "motion/react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import {
  applyDocumentBackground,
  colorForPath,
  PAGE_COLOR,
  pageOrder,
  themeClassName,
  themeForPath,
} from "@/lib/page-color";
import { normalizePath } from "@/lib/page-href";
import { cn } from "@/lib/utils";
import { usePageColor } from "@/stores/page-color";
import { usePageLayers } from "@/stores/page-layers";
import { usePageTransition } from "@/stores/page-transition";

type Props = {
  children: ReactNode;
};

/** Survives remounts so a route change cannot reset the frozen view. */
let committedPath: string | null = null;
let revealed = false;

const EASE = cubicBezier(0.3, 0, 0, 1);
const DISAPPEAR_DURATION = 0.5;
const REVEAL_DURATION = 0.5;
const SHIFT = "8vw";

const PageLayerStage = () => {
  const pathname = usePathname();
  const layers = usePageLayers((state) => state.layers);
  const release = usePageLayers((state) => state.release);
  const covered = usePageTransition((state) => state.covered);
  const covering = usePageTransition((state) => state.covering);
  const leaveStarted = usePageTransition((state) => state.leaveStarted);
  const startCover = usePageTransition((state) => state.startCover);
  const gatherSide = usePageTransition((state) => state.gatherSide);
  const entryFrom = usePageTransition((state) => state.entryFrom);
  const current = usePageColor((state) => state.current);
  const previous = usePageColor((state) => state.previous);
  const { setTheme } = useTheme();
  const reduceMotion = useReducedMotion();

  const [viewPath, setViewPath] = useState(() => committedPath ?? pathname);
  const [hasRevealed, setHasRevealed] = useState(() => revealed);
  const startedFor = useRef<string | null>(null);

  const destPath = normalizePath(pathname);
  const view = normalizePath(viewPath);
  const pathPending = view !== destPath;
  const collecting = covering && !covered;
  const showLive = hasRevealed && !pathPending && !collecting;
  const landingReveal = entryFrom === "all";
  const exitX = gatherSide === "left" ? `-${SHIFT}` : SHIFT;
  const enterX = landingReveal
    ? 0
    : gatherSide === "left"
      ? SHIFT
      : `-${SHIFT}`;
  const enterY = landingReveal ? 16 : 0;
  const duration = reduceMotion ? 0 : undefined;

  const staged = layers.filter((layer) =>
    pathPending
      ? layer.path === view || layer.path === destPath
      : layer.path === destPath,
  );

  if (covered && covering) {
    if (pathPending && startedFor.current === destPath) {
      committedPath = destPath;
      setViewPath(pathname);
    }
    if (!hasRevealed) {
      revealed = true;
      setHasRevealed(true);
    }
  }

  useLayoutEffect(() => {
    const path = destPath;
    const { covering, covered } = usePageTransition.getState();
    if (covering && !covered) {
      startedFor.current = path;
      usePageColor.getState().retarget(colorForPath(path));
      return;
    }
    if (startedFor.current === path) return;
    startedFor.current = path;

    if (view === path) {
      usePageColor.getState().reset(colorForPath(path));
    } else {
      usePageColor.getState().advance(colorForPath(path));
    }
    applyDocumentBackground(PAGE_COLOR.ink);
    setTheme("ink");
    const from = pageOrder(viewPath);
    const to = pageOrder(path);
    startCover(to >= from ? "left" : "right");
  }, [destPath, view, viewPath, startCover, setTheme]);

  useLayoutEffect(() => {
    if (pathPending) return;
    for (const layer of usePageLayers.getState().layers) {
      if (layer.path !== destPath) release(layer.path);
    }
  }, [pathPending, destPath, release]);

  useLayoutEffect(() => {
    if (collecting) {
      applyDocumentBackground(PAGE_COLOR.ink);
      setTheme("ink");
      return;
    }
    const visiblePath =
      covered && hasRevealed && !pathPending ? destPath : view;
    applyDocumentBackground(
      covered && hasRevealed && !pathPending ? current : previous,
    );
    setTheme(themeForPath(visiblePath));
  }, [
    collecting,
    covered,
    hasRevealed,
    pathPending,
    current,
    previous,
    destPath,
    view,
    setTheme,
  ]);

  return (
    <AnimatePresence>
      {staged.map((layer) => {
        const outgoing = pathPending && layer.path === view;
        return (
          <motion.div
            key={layer.path}
            className={cn(
              "fixed inset-0 overflow-hidden",
              themeClassName(themeForPath(layer.path)),
              outgoing
                ? "pointer-events-none z-20"
                : cn("z-10", !showLive && "pointer-events-none"),
            )}
            initial={false}
            animate={
              outgoing
                ? leaveStarted
                  ? { opacity: 0 }
                  : { opacity: 1 }
                : showLive
                  ? { opacity: 1 }
                  : { opacity: 0 }
            }
            exit={{ opacity: 0 }}
            transition={{
              duration: outgoing
                ? leaveStarted
                  ? (duration ?? DISAPPEAR_DURATION)
                  : 0
                : showLive
                  ? (duration ?? REVEAL_DURATION)
                  : 0,
              ease: EASE,
            }}
            aria-hidden={outgoing || !showLive ? true : undefined}
            inert={outgoing || !showLive ? true : undefined}
          >
            {layer.node}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
};

const PageTransitionDriver = ({ children }: Props) => {
  return (
    <>
      {children}
      <PageLayerStage />
    </>
  );
};

export default PageTransitionDriver;
