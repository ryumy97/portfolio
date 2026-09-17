"use client";

import Image from "next/image";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PointerEventHandler } from "@/components/pointer";
import Link from "@/components/transition-link";
import { cn } from "@/lib/utils";

const body = "text-[min(max(1.4vw,15px),18px)] leading-[1.65em]";

const components: Components = {
  h2: ({ children }) => (
    <h2 className="mt-10 mb-3 font-heading text-[min(max(2vw,18px),24px)] font-bold leading-[1.25em] tracking-[-0.02em]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-2 font-heading text-[min(max(1.6vw,16px),20px)] font-bold leading-[1.25em] tracking-[-0.02em]">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className={cn(body, "mt-4 first:mt-0")}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul className={cn(body, "mt-4 list-disc space-y-1 pl-5")}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className={cn(body, "mt-4 list-decimal space-y-1 pl-5")}>{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      className={cn(body, "mt-4 border-l-2 border-primary pl-4 italic")}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-border" />,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  pre: ({ children }) => (
    <pre className="mt-4 overflow-x-auto rounded-md bg-muted px-4 py-3 font-mono text-[min(max(1.1vw,13px),15px)] leading-[1.55em]">
      {children}
    </pre>
  ),
  img: ({ src, alt }) => {
    if (!src || typeof src !== "string") return null;
    if (/\.(mp4|webm|mov|webp)$/i.test(src)) {
      const stem = src.replace(/\.(mp4|webm|mov|webp)$/i, "");
      return (
        <video
          className="w-full"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt || undefined}
        >
          <source src={`${stem}.mp4`} type="video/mp4" />
          {/* biome-ignore lint/performance/noImgElement: animated WebP fallback inside <video> */}
          <img src={`${stem}.webp`} alt={alt ?? ""} className="w-full" />
        </video>
      );
    }
    return (
      <Image
        src={src}
        alt={alt ?? ""}
        width={1600}
        height={900}
        className="h-auto w-full"
      />
    );
  },
  a: ({ href, children }) => {
    if (!href) return children;
    const external = href.startsWith("http://") || href.startsWith("https://");
    return (
      <PointerEventHandler asChild type="underline">
        <Link
          href={href}
          className="text-secondary italic"
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {children}
        </Link>
      </PointerEventHandler>
    );
  },
};

export function BlogMarkdown({ content }: { content: string }) {
  return (
    <div className="[&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.92em]">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
