import PageLayer from "@/components/page-layer";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import Link from "@/components/transition-link";
import { PageLink, Title } from "@/components/ui/typography";
import { ImageSection, TextSection } from "../section";
import main from "./assets/aimhigh.png";
import logo from "./assets/main.png";

export default function Page() {
  return (
    <PageLayer>
      <SmoothScroll horizontal>
        <main className="flex flex-col md:flex-row min-h-svh w-full md:w-max items-center gap-[10vw] md:gap-[5vw] px-8 pt-24 pb-16 md:py-0">
          <div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
            <Title className="">
              <div className="">Aim High</div>
              <div className="text-primary mt-[0.3em]">
                Charitable Trust · 2020
              </div>
            </Title>
            <PageLink className="w-full mt-[1em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://www.aimhightrust.co.nz/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  https://www.aimhightrust.co.nz/
                </Link>
              </PointerEventHandler>
            </PageLink>
          </div>

          <TextSection text="A content website for a charity. The aim of this project was for non-developers to maintain the website." />

          <ImageSection image={logo} type="default" />
          <ImageSection image={main} type="desktop" />

          <TextSection text="Using WordPress CMS, staff can update pages, and post blog posts without a developer in the loop." />

          <div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
            <Title className="">
              <div className="text-primary">Links</div>
            </Title>

            <PageLink className="w-full mt-[2em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://www.aimhightrust.co.nz/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  https://www.aimhightrust.co.nz/
                </Link>
              </PointerEventHandler>
            </PageLink>
          </div>
        </main>
      </SmoothScroll>
    </PageLayer>
  );
}
