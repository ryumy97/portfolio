"use client";

import { ArrowRightIcon } from "lucide-react";
import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, Title } from "@/components/ui/typography";
import { createImageUrl } from "@/lib/image";
import { ListItemSection } from "./section";

export default function Page() {
  return (
    <PageTunnelIn>
      <SmoothScroll horizontal>
        <PageDescription className="absolute bottom-4 right-4 flex items-center gap-[1vw] justify-center">
          Scroll this way{" "}
          <ArrowRightIcon className="w-[min(max(2vw,16px),24px)]" />
        </PageDescription>

        <main className="flex min-h-screen w-max items-center gap-[10vw] md:gap-[5vw] px-8">
          <div className="md:max-w-[30vw] max-w-[100vw] w-screen">
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
    </PageTunnelIn>
  );
}
