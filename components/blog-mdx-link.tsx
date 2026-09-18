"use client";

import type { ComponentPropsWithoutRef } from "react";
import { PointerEventHandler } from "@/components/pointer";
import Link from "@/components/transition-link";

export function BlogMdxLink({
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  if (!href) return children;

  const external = href.startsWith("http://") || href.startsWith("https://");
  return (
    <PointerEventHandler asChild type="underline">
      <Link
        href={href}
        className="text-secondary italic"
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        {...props}
      >
        {children}
      </Link>
    </PointerEventHandler>
  );
}
