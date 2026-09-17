#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const extra = process.argv.slice(2);
const biome = path.join(root, "node_modules", ".bin", "biome");

const biomeResult = spawnSync(biome, ["check", ".", ...extra], {
  stdio: "inherit",
  cwd: root,
});
if (biomeResult.status) process.exit(biomeResult.status);

const blog = spawnSync(
  process.execPath,
  [path.join(root, "scripts/lint-blog.mjs")],
  {
    stdio: "inherit",
    cwd: root,
  },
);
process.exit(blog.status ?? 1);
