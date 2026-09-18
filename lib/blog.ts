import type { MDXContent } from "mdx/types";
import { cache } from "react";
import { blogSources } from "./blog-sources.generated";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  draft: boolean;
  Content: MDXContent;
};

type BlogSource = {
  default: MDXContent;
  frontmatter?: unknown;
};

export function parseBlogTags(value: string | undefined) {
  if (!value) return [];
  return value
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((tag) => unwrap(tag.trim()))
    .filter(Boolean);
}

export function blogTagSlug(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getBlogTags(posts: readonly BlogPost[]) {
  const tags = new Map<string, string>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = blogTagSlug(tag);
      if (slug && !tags.has(slug)) tags.set(slug, tag);
    }
  }
  return [...tags.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([slug, label]) => ({ slug, label }));
}

export function blogTagOptions(tags: readonly string[]) {
  return tags
    .map((label) => ({ slug: blogTagSlug(label), label }))
    .filter((tag) => tag.slug);
}

function unwrap(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function stringifyFrontmatterValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stringifyFrontmatterValue(item)).join(", ");
  }
  return String(value);
}

function readFrontmatter(value: unknown) {
  if (!value || typeof value !== "object") {
    return {} as Record<string, string>;
  }

  const data: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    data[key] = stringifyFrontmatterValue(raw);
  }
  return data;
}

function toPost(slug: string, source: BlogSource): BlogPost {
  const data = readFrontmatter(source.frontmatter);
  return {
    slug,
    title: data.title || slug,
    date: data.date || "",
    description: data.description || "",
    tags: parseBlogTags(data.tags),
    draft: data.draft === "true",
    Content: source.default,
  };
}

function isPublished(post: BlogPost) {
  return !post.draft || process.env.NODE_ENV === "development";
}

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

function parseBlogDateTime(value: string) {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  return parsed.getTime();
}

export function formatBlogDate(value: string) {
  const time = parseBlogDateTime(value);
  if (Number.isNaN(time)) return value.toUpperCase();

  const parsed = new Date(time);
  const day = parsed.getDate();
  const month = MONTHS[parsed.getMonth()];
  const year = parsed.getFullYear();
  return `${day} ${month} ${year}`;
}

function isSafeBlogSlug(slug: string) {
  if (!slug || slug.includes("\\") || slug.includes("..")) return false;
  return slug
    .split("/")
    .every((segment) => Boolean(segment) && !segment.startsWith("."));
}

function seriesOf(slug: string) {
  const index = slug.lastIndexOf("/");
  return index === -1 ? "" : slug.slice(0, index);
}

export const getBlogSlugs = cache(async () => {
  return Object.keys(blogSources);
});

export const getBlogPost = cache(async (slug: string) => {
  if (!isSafeBlogSlug(slug)) {
    return null;
  }

  const source = (blogSources as Record<string, BlogSource | undefined>)[slug];
  if (!source?.default) return null;

  const post = toPost(slug, source);
  return isPublished(post) ? post : null;
});

export const getBlogPosts = cache(async () => {
  const slugs = await getBlogSlugs();
  const posts = await Promise.all(slugs.map((slug) => getBlogPost(slug)));

  return posts
    .filter((post): post is BlogPost => post !== null)
    .sort(
      (a, b) =>
        parseBlogDateTime(b.date) - parseBlogDateTime(a.date) ||
        a.title.localeCompare(b.title),
    );
});

export function getAdjacentBlogPosts(posts: readonly BlogPost[], slug: string) {
  const series = seriesOf(slug);
  const grouped = posts.filter((post) => seriesOf(post.slug) === series);
  const index = grouped.findIndex((post) => post.slug === slug);
  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: grouped[index + 1] ?? null,
    next: grouped[index - 1] ?? null,
  };
}
