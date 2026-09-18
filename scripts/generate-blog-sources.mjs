#!/usr/bin/env node
/**
 * Emit static MDX imports so Turbopack can HMR blog posts on save.
 */

import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const blogDir = path.join(root, "content/blog");
const output = path.join(root, "lib/blog-sources.generated.ts");

function identifier(index) {
  return `source${index}`;
}

function toPosix(file) {
  return file.split(path.sep).join("/");
}

async function collectMdx(dir, relative = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMdx(fullPath, rel)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".mdx")) files.push(rel);
  }

  return files.sort();
}

export async function generateBlogSources() {
  const files = await collectMdx(blogDir);

  const imports = files.map(
    (file, index) =>
      `import * as ${identifier(index)} from "../content/blog/${toPosix(file)}";`,
  );
  const entries = files.map((file, index) => {
    const slug = toPosix(file).replace(/\.mdx$/, "");
    return `  ${JSON.stringify(slug)}: ${identifier(index)},`;
  });

  const contents = `// generated ${Date.now()}
${imports.join("\n")}${imports.length ? "\n\n" : ""}export const blogSources = {${
    entries.length ? `\n${entries.join("\n")}\n` : ""
  }};
`;

  await writeFile(output, contents);
}

export async function copyKatexAssets() {
  const src = path.join(root, "node_modules/katex/dist");
  const dest = path.join(root, "public/katex");
  await mkdir(dest, { recursive: true });
  await cp(path.join(src, "katex.min.css"), path.join(dest, "katex.min.css"));
  await cp(path.join(src, "fonts"), path.join(dest, "fonts"), {
    recursive: true,
  });
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  await generateBlogSources();
  await copyKatexAssets();
}
