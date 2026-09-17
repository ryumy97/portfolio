"use client";

import { PointerEventHandler } from "@/components/pointer";
import Link from "@/components/transition-link";
import { CVSubHeading } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export type BlogTagOption = {
  slug: string;
  label: string;
};

function TagLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <PointerEventHandler asChild type="underline">
      <CVSubHeading asChild>
        <Link
          href={href}
          className={cn(
            "uppercase",
            active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {label}
        </Link>
      </CVSubHeading>
    </PointerEventHandler>
  );
}

export function BlogTagFilter({
  tags,
  active,
}: {
  tags: readonly BlogTagOption[];
  active?: string | null;
}) {
  if (tags.length === 0) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
      <li>
        <TagLink href="/blog" label="All" active={!active} />
      </li>
      {tags.map((tag) => (
        <li key={tag.slug}>
          <TagLink
            href={active === tag.slug ? "/blog" : `/blog?tag=${tag.slug}`}
            label={tag.label}
            active={active === tag.slug}
          />
        </li>
      ))}
    </ul>
  );
}

export function BlogTagList({ tags }: { tags: readonly BlogTagOption[] }) {
  if (tags.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {tags.map((tag) => (
        <li key={tag.slug}>
          <TagLink
            href={`/blog?tag=${tag.slug}`}
            label={tag.label}
            active={false}
          />
        </li>
      ))}
    </ul>
  );
}
