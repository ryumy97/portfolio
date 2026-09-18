import type { MDXContent } from "mdx/types";
import "./blog-katex.css";

export function BlogMdx({ Content }: { Content: MDXContent }) {
  return (
    <div className="[&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.92em]">
      <link rel="stylesheet" href="/katex/katex.min.css" />
      <Content />
    </div>
  );
}
