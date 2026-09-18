import Link from "next/link";
import { CVSubHeading, PageParagraphHeading } from "@/components/ui/typography";
import { type BlogPost, formatBlogDate } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { PointerEventHandler } from "./pointer";

function FooterLink({
  label,
  post,
  align,
}: {
  label: string;
  post: BlogPost | null;
  align: "left" | "right";
}) {
  if (!post)
    return (
      <div
        className={cn(
          "flex min-w-0 flex-col gap-1",
          align === "right" && "items-end text-right",
        )}
      >
        <CVSubHeading className="text-muted-foreground">{label}</CVSubHeading>
      </div>
    );

  return (
    <PointerEventHandler
      asChild
      type={align === "right" ? "bullet-top-right" : "bullet-top-left"}
    >
      <Link href={`/blog/${post.slug}`} className="w-fit max-w-full">
        <div
          className={cn(
            "flex min-w-0 flex-col gap-1",
            align === "right" && "items-end text-right",
          )}
        >
          <CVSubHeading className="text-primary">{label}</CVSubHeading>
          {post ? (
            <>
              <CVSubHeading className="text-muted-foreground">
                {formatBlogDate(post.date)}
              </CVSubHeading>
              <PageParagraphHeading className="font-heading font-bold tracking-[-0.02em]">
                {post.title}
              </PageParagraphHeading>
            </>
          ) : null}
        </div>
      </Link>
    </PointerEventHandler>
  );
}

export function BlogPostFooter({
  previous,
  next,
}: {
  previous: BlogPost | null;
  next: BlogPost | null;
}) {
  return (
    <footer className="mt-20 grid grid-cols-2 gap-6 border-t border-border pt-10">
      <FooterLink label="Prev" post={previous} align="left" />
      <FooterLink label="Next" post={next} align="right" />
    </footer>
  );
}
