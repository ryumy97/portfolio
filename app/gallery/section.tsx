"use client";

import {
  cubicBezier,
  motion,
  transform,
  useAnimationFrame,
  useMotionValue,
} from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { PointerEventHandler } from "@/components/pointer";
import { useScrollEvent } from "@/components/smooth-scroll";
import Link from "@/components/transition-link";
import { ProjectTitle } from "@/components/ui/typography";
import { lerp } from "@/lib/math";
import { useMdUp } from "@/lib/use-md-up";
import { cn } from "@/lib/utils";

const useRevealMotionValues = () => {
  const ref = useRef<HTMLDivElement>(null);
  const mdUp = useMdUp();

  const dataRef = useRef({
    target: {
      y: 100,
    },
    current: {
      y: 100,
    },
  });

  const y = useMotionValue("5%");

  const updateFromRect = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const pos = mdUp ? rect.left : rect.top;
    const start = mdUp ? window.innerWidth * 0.75 : window.innerHeight * 0.75;
    const end = mdUp ? window.innerWidth : window.innerHeight;

    dataRef.current.target.y = transform(
      transform(pos, [start, end], [1, 0], {
        clamp: true,
      }),
      [0, 1],
      [100, 0],
      {
        clamp: true,
        ease: cubicBezier(0.3, 0, 0.3, 1),
      },
    );
  }, [mdUp]);

  useScrollEvent(updateFromRect);

  useEffect(() => {
    updateFromRect();
  }, [updateFromRect]);

  useAnimationFrame((_, delta) => {
    const t = delta / 1000 / 0.2;

    dataRef.current.current.y = lerp(
      dataRef.current.current.y,
      dataRef.current.target.y,
      t,
    );

    y.set(`${dataRef.current.current.y}vh`);
  });

  return {
    y,
    ref,
  };
};

export const ListItemSection: React.FC<{
  link: string;
  title: React.ReactNode;
  image: string;
  className?: string;
}> = ({ link, title, image, className }) => {
  const { y, ref } = useRevealMotionValues();

  return (
    <div
      className={cn(
        "w-[80vw] md:w-[30vw] text-center relative md:mr-[30vw]",
        className,
      )}
    >
      <motion.div
        className="w-full border-white overflow-hidden border-[0.5vw] aspect-landscape shadow-2xl"
        style={{ y }}
        ref={ref}
      >
        <Image
          src={image}
          alt="Gallery"
          fill
          sizes="(max-width: 768px) 80vw, 30vw"
          loading="eager"
        />
      </motion.div>
      <ProjectTitle className="relative text-left">
        <PointerEventHandler asChild type="underline" offsetHeight={2}>
          <Link href={link}>{title}</Link>
        </PointerEventHandler>
      </ProjectTitle>
    </div>
  );
};

export const ImageSection: React.FC<{
  image: string;
  alt: string;
  layout: "landscape" | "portrait";
  className?: string;
}> = ({ image, alt, layout, className }) => {
  const { y, ref } = useRevealMotionValues();

  return (
    <motion.div
      className={cn(
        "text-center relative md:mr-[10vw] border-white overflow-hidden border-[0.5vw] shadow-2xl",
        {
          "w-[90vw] md:w-[30vw] aspect-landscape": layout === "landscape",
          "w-[60vw] md:w-[20vw] aspect-portrait": layout === "portrait",
        },
        className,
      )}
      style={{ y }}
      ref={ref}
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes={
          layout === "landscape"
            ? "(max-width: 768px) 90vw, 30vw"
            : "(max-width: 768px) 60vw, 20vw"
        }
        className="object-cover"
        loading="eager"
      />
    </motion.div>
  );
};
