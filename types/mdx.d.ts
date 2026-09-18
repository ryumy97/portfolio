declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";
  import type { ComponentType } from "react";

  const MDXComponent: ComponentType<MDXProps>;
  export default MDXComponent;
  export const frontmatter: Record<string, unknown> | undefined;
}
