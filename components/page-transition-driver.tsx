"use client";

import { usePathname } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  applyDocumentBackground,
  colorForPath,
  PAGE_COLOR,
  pageOrder,
} from "@/lib/page-color";
import { normalizePath } from "@/lib/page-href";
import { usePageColor } from "@/stores/page-color";
import { usePageTransition } from "@/stores/page-transition";

type Props = {
  children: ReactNode;
};

/** Survives remounts so a route change cannot reset the frozen view. */
let committedPath: string | null = null;
let snapshotHtml = "";
let revealed = false;

const PageTransitionDriver = ({ children }: Props) => {
  const pathname = usePathname();
  const covered = usePageTransition((state) => state.covered);
  const covering = usePageTransition((state) => state.covering);
  const startCover = usePageTransition((state) => state.startCover);
  const markRevealed = usePageTransition((state) => state.markRevealed);
  const current = usePageColor((state) => state.current);
  const previous = usePageColor((state) => state.previous);

  const [viewPath, setViewPath] = useState(() => committedPath ?? pathname);
  const [hasRevealed, setHasRevealed] = useState(() => revealed);
  const liveRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<HTMLDivElement>(null);
  const startedFor = useRef<string | null>(null);

  const pathPending = normalizePath(viewPath) !== normalizePath(pathname);
  const collecting = covering && !covered;
  const hideLive = pathPending || !hasRevealed || collecting;

  if (covered && covering) {
    if (pathPending) {
      committedPath = normalizePath(pathname);
      setViewPath(pathname);
    }
    if (!hasRevealed) {
      revealed = true;
      setHasRevealed(true);
    }
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.origin !== window.location.origin) return;
      const next = normalizePath(anchor.pathname);
      const currentPath = normalizePath(window.location.pathname);
      if (next === currentPath) return;
      snapshotHtml = liveRef.current?.innerHTML ?? snapshotHtml;
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useLayoutEffect(() => {
    const path = normalizePath(pathname);
    const { covering, covered } = usePageTransition.getState();
    if (covering && !covered) {
      startedFor.current = path;
      usePageColor.getState().retarget(colorForPath(path));
      return;
    }
    if (startedFor.current === path) return;
    startedFor.current = path;

    if (normalizePath(viewPath) === path) {
      usePageColor.getState().reset(colorForPath(path));
    } else {
      usePageColor.getState().advance(colorForPath(path));
    }
    applyDocumentBackground(PAGE_COLOR.ink);
    const from = pageOrder(viewPath);
    const to = pageOrder(path);
    startCover(to >= from ? "left" : "right");
  }, [pathname, viewPath, startCover]);

  useLayoutEffect(() => {
    if (pathPending && !collecting) {
      if (holdRef.current) holdRef.current.innerHTML = snapshotHtml;
      return;
    }
    if (!hasRevealed) return;
    snapshotHtml = liveRef.current?.innerHTML ?? "";
  });

  useLayoutEffect(() => {
    if (collecting) {
      applyDocumentBackground(PAGE_COLOR.ink);
      return;
    }
    applyDocumentBackground(
      covered && hasRevealed && !pathPending ? current : previous,
    );
  }, [collecting, covered, hasRevealed, pathPending, current, previous]);

  useLayoutEffect(() => {
    if (!covering || !covered) return;
    markRevealed();
  }, [covering, covered, markRevealed]);

  return (
    <>
      <div
        ref={liveRef}
        className="relative z-10"
        hidden={hideLive}
        aria-hidden={hideLive || undefined}
        inert={hideLive || undefined}
      >
        {children}
      </div>
      {pathPending && !collecting ? (
        <div
          ref={holdRef}
          className="pointer-events-none relative z-10"
          aria-hidden
        />
      ) : null}
    </>
  );
};

export default PageTransitionDriver;
