import { cache } from "react";
import { blogSources } from "./blog-sources.generated";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  draft: boolean;
  content: string;
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

function parseFrontmatter(raw: string) {
  const match = raw.match(FRONTMATTER);
  if (!match) {
    return { data: {} as Record<string, string>, content: raw.trim() };
  }

  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    if (!key) continue;
    data[key] = unwrap(line.slice(separator + 1).trim());
  }

  return { data, content: match[2].trim() };
}

function toPost(slug: string, raw: string): BlogPost {
  const { data, content } = parseFrontmatter(raw);
  return {
    slug,
    title: data.title || slug,
    date: data.date || "",
    description: data.description || "",
    tags: parseBlogTags(data.tags),
    draft: data.draft === "true",
    content,
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

export const getBlogSlugs = cache(async () => {
  return Object.keys(blogSources);
});

export const getBlogPost = cache(async (slug: string) => {
  if (slug.includes("/") || slug.includes("\\") || slug.startsWith(".")) {
    return null;
  }

  const raw = blogSources[slug];
  if (typeof raw !== "string") return null;

  const post = toPost(slug, raw);
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
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: posts[index + 1] ?? null,
    next: posts[index - 1] ?? null,
  };
}
