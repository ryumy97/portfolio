#!/usr/bin/env node
/**
 * Require blog markdown files to start with:
 *
 * ---
 * title: ...
 * date: YYYY-MM-DD
 * description: ...
 * tags: tag, another
 * ---
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED = ["title", "date", "description", "tags"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const BLOG_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
  "blog",
);

function unwrap(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER);
  if (!match) return null;

  const keys = [];
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    if (!key) continue;
    keys.push(key);
    data[key] = unwrap(line.slice(separator + 1).trim());
  }

  return { keys, data };
}

function lintFile(raw) {
  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    return [
      "missing frontmatter section:\n---\ntitle:\ndate:\ndescription:\ntags:\n---",
    ];
  }

  const errors = [];
  for (const field of REQUIRED) {
    if (!(field in parsed.data)) {
      errors.push(`missing "${field}"`);
    } else if (!parsed.data[field]) {
      errors.push(`"${field}" is empty`);
    }
  }

  const requiredKeys = parsed.keys.filter((key) => REQUIRED.includes(key));
  if (
    requiredKeys.length === REQUIRED.length &&
    requiredKeys.join() !== REQUIRED.join()
  ) {
    errors.push(
      "frontmatter keys must be in order: title, date, description, tags",
    );
  }

  const date = parsed.data.date;
  if (date && !DATE.test(date)) {
    errors.push(`"date" must be YYYY-MM-DD (got "${date}")`);
  }

  const tags = (parsed.data.tags ?? "")
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  if ("tags" in parsed.data && tags.length === 0) {
    errors.push('"tags" must list at least one tag');
  }

  return errors;
}

async function main() {
  let files = [];
  try {
    files = (await readdir(BLOG_DIR))
      .filter((file) => file.endsWith(".md"))
      .sort();
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  let failed = 0;
  for (const file of files) {
    const raw = await readFile(path.join(BLOG_DIR, file), "utf8");
    const errors = lintFile(raw);
    if (errors.length === 0) continue;
    failed += 1;
    console.error(`${file}`);
    for (const error of errors) {
      console.error(`  ${error}`);
    }
  }

  if (failed > 0) {
    console.error(
      `\n${failed} blog markdown file${failed === 1 ? "" : "s"} failed frontmatter lint.`,
    );
    process.exit(1);
  }
}

await main();
