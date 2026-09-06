import type { PropsWithChildren } from "react";
import { PointerEventHandler } from "@/components/pointer";
import Link from "@/components/transition-link";

export const ProjectLink: React.FC<PropsWithChildren & { link: string }> = ({
  children,
  link,
}) => {
  return (
    <PointerEventHandler asChild type="bullet" offsetX={-8} offsetY={1}>
      <Link href={link} className="relative inline-flex items-baseline">
        <span className="absolute top-1/2 left-0 translate-x-[calc(-100%-4px)] -translate-y-[calc(50%-1px)] w-2 h-2 bg-secondary rounded-full"></span>
        {children}
      </Link>
    </PointerEventHandler>
  );
};
