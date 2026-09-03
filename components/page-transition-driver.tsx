"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { normalizePath } from "@/lib/page-href";
import { usePageTransition } from "@/stores/page-transition";

const PageTransitionDriver = () => {
  const router = useRouter();
  const pathname = usePathname();
  const pendingPath = usePageTransition((state) => state.pendingPath);
  const covered = usePageTransition((state) => state.covered);
  const layer = usePageTransition((state) => state.layer);
  const markRevealed = usePageTransition((state) => state.markRevealed);
  const pushedFor = useRef<string | null>(null);

  useEffect(() => {
    if (pendingPath) router.prefetch(pendingPath);
  }, [pendingPath, router]);

  useEffect(() => {
    if (!covered || layer !== "front") return;
    if (!pendingPath) {
      markRevealed();
      return;
    }
    if (normalizePath(pathname) === normalizePath(pendingPath)) {
      pushedFor.current = null;
      markRevealed();
      return;
    }
    if (pushedFor.current === pendingPath) return;
    pushedFor.current = pendingPath;
    router.push(pendingPath);
  }, [pendingPath, covered, layer, pathname, router, markRevealed]);

  return null;
};

export default PageTransitionDriver;
