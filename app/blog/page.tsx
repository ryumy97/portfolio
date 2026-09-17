import type { Metadata } from "next";
import { BlogTagFilter, BlogTagList } from "@/components/blog-tags";
import PageLayer from "@/components/page-layer";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import Link from "@/components/transition-link";
import { Grid, SubGrid } from "@/components/ui/grid";
import {
  CVSubHeading,
  PageDescription,
  PageParagraphHeading,
  Title,
} from "@/components/ui/typography";
import {
  blogTagOptions,
  blogTagSlug,
  formatBlogDate,
  getBlogPosts,
  getBlogTags,
} from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Ryumy",
  description: "Journals of study.",
};

function selectedTag(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>;
}) {
  const { tag } = await searchParams;
  const active = selectedTag(tag);
  const posts = await getBlogPosts();
  const tags = getBlogTags(posts);
  const filtered = active
    ? posts.filter((post) =>
        post.tags.some((item) => blogTagSlug(item) === active),
      )
    : posts;

  return (
    <PageLayer>
      <SmoothScroll>
        <div className="mt-36" />
        <Grid className="w-full max-md:p-4">
          <div className="col-start-2 col-end-9 md:col-end-7">
            <Title className="text-primary">Blog</Title>
            <PageDescription className="mt-2">
              Here I write about my interests and studies.
            </PageDescription>
            <BlogTagFilter tags={tags} active={active} />
          </div>
          <SubGrid className="col-start-2 col-end-9 md:col-end-7 mt-12 gap-y-10 content-start pb-24">
            {filtered.length === 0 ? (
              <PageDescription className="col-span-full text-muted-foreground">
                {posts.length === 0
                  ? "No entries yet."
                  : "No entries with this tag."}
              </PageDescription>
            ) : (
              filtered.map((post) => (
                <article
                  key={post.slug}
                  className="col-span-full md:col-span-6 flex flex-col gap-1"
                >
                  <CVSubHeading className="text-primary">
                    {formatBlogDate(post.date)}
                  </CVSubHeading>
                  <div className="w-fit">
                    <PointerEventHandler asChild type="underline">
                      <Link href={`/blog/${post.slug}`}>
                        <PageParagraphHeading className="font-heading font-bold tracking-[-0.02em]">
                          {post.title}
                        </PageParagraphHeading>
                      </Link>
                    </PointerEventHandler>
                  </div>
                  {post.description ? (
                    <PageDescription className="text-muted-foreground">
                      {post.description}
                    </PageDescription>
                  ) : null}
                  <BlogTagList tags={blogTagOptions(post.tags)} />
                </article>
              ))
            )}
          </SubGrid>
        </Grid>
      </SmoothScroll>
    </PageLayer>
  );
}
