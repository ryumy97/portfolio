import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogMarkdown } from "@/components/blog-markdown";
import { BlogTagList } from "@/components/blog-tags";
import PageLayer from "@/components/page-layer";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import Link from "@/components/transition-link";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { CVSubHeading, Title } from "@/components/ui/typography";
import {
  blogTagOptions,
  formatBlogDate,
  getBlogPost,
  getBlogPosts,
} from "@/lib/blog";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} — Ryumy`,
    description: post.description || undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <PageLayer>
      <SmoothScroll>
        <Grid className="w-full max-md:p-4 pt-36 pb-24">
          <article className="col-span-full md:col-start-2 md:col-end-8">
            <PointerEventHandler asChild type="underline">
              <Button variant="ghost" size="nav" asChild>
                <Link href="/blog">Back</Link>
              </Button>
            </PointerEventHandler>
            <Title className="mt-6">{post.title}</Title>
            <CVSubHeading className="mt-3 text-primary">
              {formatBlogDate(post.date)}
            </CVSubHeading>
            <div className="mt-3">
              <BlogTagList tags={blogTagOptions(post.tags)} />
            </div>
            <div className="mt-10">
              <BlogMarkdown content={post.content} />
            </div>
          </article>
        </Grid>
      </SmoothScroll>
    </PageLayer>
  );
}
