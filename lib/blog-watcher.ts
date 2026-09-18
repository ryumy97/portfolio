import { spawn } from "node:child_process";
import { watch } from "node:fs";
import path from "node:path";

export function watchBlogSources() {
  if (process.env.NODE_ENV !== "development") return;

  const blogDir = path.join(process.cwd(), "content/blog");
  const script = path.join(process.cwd(), "scripts/generate-blog-sources.mjs");
  let timer: ReturnType<typeof setTimeout> | undefined;

  const generate = () => {
    spawn(process.execPath, [script], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
  };

  watch(blogDir, { recursive: true }, (_event, filename) => {
    if (typeof filename !== "string" || !filename.endsWith(".mdx")) return;
    clearTimeout(timer);
    timer = setTimeout(generate, 50);
  });
}
