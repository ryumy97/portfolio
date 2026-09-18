import type { MDXComponents } from "mdx/types";
import { BlogMdxImage } from "@/components/blog-mdx-image";
import { BlogMdxLink } from "@/components/blog-mdx-link";
import { cn } from "@/lib/utils";

const body = "text-[min(max(1.4vw,15px),18px)] leading-[1.65em]";

const components = {
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
  img: BlogMdxImage,
  a: BlogMdxLink,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
