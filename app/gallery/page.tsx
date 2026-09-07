"use client";

import PageLayer from "@/components/page-layer";
import SmoothScroll from "@/components/smooth-scroll";
import { Title } from "@/components/ui/typography";
import { createImageUrl } from "@/lib/image";
import { ListItemSection } from "./section";

export default function Page() {
  return (
    <PageLayer>
      <SmoothScroll horizontal>
        <main className="flex flex-col md:flex-row min-h-svh w-full md:w-max items-center gap-[10vw] md:gap-[5vw] px-8 pt-24 pb-16 md:py-0">
          <div className="md:max-w-[30vw] w-full md:w-screen">
            <Title className="">
              <div className="text-primary">Gallery</div>
            </Title>
          </div>

          <ListItemSection
            title="2025"
            image={createImageUrl(
              "upload/b502d3d8-3fff-43c7-9935-cef2ff95a4a6/SAM_0091.png",
            )}
            link="/gallery/2025"
          />
        </main>
      </SmoothScroll>
    </PageLayer>
  );
}
