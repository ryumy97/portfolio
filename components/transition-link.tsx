"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { destinationPath, normalizePath } from "@/lib/page-href";
import { usePageTransition } from "@/stores/page-transition";

type Props = ComponentProps<typeof NextLink>;

export default function TransitionLink({
  href,
  target,
  onNavigate,
  ...rest
}: Props) {
  const pathname = usePathname();
  const begin = usePageTransition((state) => state.begin);

  return (
    <NextLink
      href={href}
      target={target}
      onNavigate={(event) => {
        let prevented = false;
        onNavigate?.({
          preventDefault: () => {
            prevented = true;
            event.preventDefault();
          },
        });
        if (prevented) return;
        if (target === "_blank") return;
        const path = destinationPath(href);
        if (!path) return;
        if (normalizePath(path) === normalizePath(pathname)) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }
        event.preventDefault();
        begin(path);
      }}
      {...rest}
    />
  );
}
