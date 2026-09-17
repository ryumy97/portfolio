#!/usr/bin/env node
/**
 * Emit static markdown imports so Turbopack can HMR blog posts on save.
 */

import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const blogDir = path.join(root, "content/blog");
const output = path.join(root, "lib/blog-sources.generated.ts");

function slugFromFile(file) {
  return file.slice(0, -3);
}

function identifier(index) {
  return `source${index}`;
}

export async function generateBlogSources() {
  const files = (await readdir(blogDir))
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .sort();

  const imports = files.map(
    (file, index) =>
      `import ${identifier(index)} from "../content/blog/${file}";`,
  );
  const entries = files.map(
    (file, index) =>
      `  ${JSON.stringify(slugFromFile(file))}: ${identifier(index)},`,
  );

  const contents = `// generated ${Date.now()}
${imports.join("\n")}${imports.length ? "\n\n" : ""}export const blogSources: Record<string, string> = {${
    entries.length ? `\n${entries.join("\n")}\n` : ""
  }};
`;

  await writeFile(output, contents);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  await generateBlogSources();
}
