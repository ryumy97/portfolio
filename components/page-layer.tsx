"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useLayoutEffect } from "react";
import { normalizePath } from "@/lib/page-href";
import { usePageLayers } from "@/stores/page-layers";

type Props = {
  children: ReactNode;
};

const PageLayer = ({ children }: Props) => {
  const pathname = usePathname();
  const path = normalizePath(pathname);

  useLayoutEffect(() => {
    usePageLayers.getState().register(path, children);
  }, [path, children]);

  useLayoutEffect(() => {
    return () => {
      usePageLayers.getState().dismiss(path);
    };
  }, [path]);

  return null;
};

export default PageLayer;
