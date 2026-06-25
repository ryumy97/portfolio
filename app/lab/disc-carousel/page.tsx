"use client";

import { LabPageLayout } from "@/app/lab/lab-page-layout";
import DiscCarouselCanvas from "./canvas";

export default function DiscCarouselPage() {
  return (
    <LabPageLayout
      title="Disc Carousel"
      description="Portfolio project stills on planes revolving around the Y axis."
      sidebar={null}
    >
      <DiscCarouselCanvas />
    </LabPageLayout>
  );
}
