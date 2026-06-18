"use client";

import Link from "next/link";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import { Grid, SubGrid } from "@/components/ui/grid";
import {
  CVSubHeading,
  PageDescription,
  PageParagraphHeading,
  Title,
} from "@/components/ui/typography";
import {
  LAB_CATEGORIES,
  type LabCategory,
  type LabEntry,
  type LabSubcategory,
} from "@/lib/lab/labs";

function LabLink({ href, title }: LabEntry) {
  return (
    <PointerEventHandler asChild type="underline" offsetY={8}>
      <Link href={href} className="w-fit block">
        <PageParagraphHeading className="relative font-heading font-bold leading-none transition-all duration-300">
          {title}
          <span className="absolute bottom-[8%] left-0 h-0.5 w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
        </PageParagraphHeading>
      </Link>
    </PointerEventHandler>
  );
}

function LabList({ labs }: { labs: readonly LabEntry[] }) {
  return (
    <SubGrid className="col-span-full gap-y-4">
      {labs.map((lab) => (
        <div key={lab.href} className="col-span-1 pr-[1vw] mt-2">
          <LabLink {...lab} />
        </div>
      ))}
    </SubGrid>
  );
}

function LabSubcategorySection({ title, labs }: LabSubcategory) {
  return (
    <SubGrid className="col-span-full">
      <CVSubHeading
        asChild
        className="col-span-full text-muted-foreground mt-4"
      >
        <h3>{title}</h3>
      </CVSubHeading>
      <LabList labs={labs} />
    </SubGrid>
  );
}

function LabCategorySection({ title, labs, subcategories }: LabCategory) {
  return (
    <SubGrid asChild>
      <section className="col-span-full">
        <PageParagraphHeading
          asChild
          className="col-span-full font-heading font-bold tracking-[-0.02em] text-primary"
        >
          <h2>{title}</h2>
        </PageParagraphHeading>
        {subcategories ? (
          <SubGrid className="col-span-full gap-y-12">
            {subcategories.map((subcategory) => (
              <LabSubcategorySection key={subcategory.title} {...subcategory} />
            ))}
          </SubGrid>
        ) : labs ? (
          <LabList labs={labs} />
        ) : null}
      </section>
    </SubGrid>
  );
}

export default function Labs() {
  return (
    <PageTunnelIn>
      <SmoothScroll>
        <div className="mt-14" />
        <Grid className="w-full max-md:p-4">
          <div className="col-span-full md:col-start-2 md:col-end-10">
            <Title className="text-primary">Lab</Title>
            <PageDescription>
              Experiments in Gaussian Splatting, Three.js, WebGL shaders, and
              canvas.
            </PageDescription>
          </div>
          <SubGrid className="col-span-full md:col-start-2 md:col-end-10 mt-12 gap-y-14 content-start">
            {LAB_CATEGORIES.map((category) => (
              <LabCategorySection key={category.title} {...category} />
            ))}
          </SubGrid>
        </Grid>
      </SmoothScroll>
    </PageTunnelIn>
  );
}
