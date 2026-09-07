import PageLayer from "@/components/page-layer";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import Link from "@/components/transition-link";
import { PageLink, Title } from "@/components/ui/typography";
import { ImageSection, TextSection } from "../section";
import hero from "./assets/hero.png";
import main from "./assets/main.png";

export default function Page() {
  return (
    <PageLayer>
      <SmoothScroll horizontal>
        <main className="flex flex-col md:flex-row min-h-svh w-full md:w-max items-center gap-[10vw] md:gap-[5vw] px-8 pt-24 pb-16 md:py-0">
          <div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
            <Title className="">
              <div className="">Heritage New Zealand</div>
              <div className="text-primary mt-[0.3em]">- DDB NZ</div>
            </Title>
            <PageLink className="w-full mt-[1em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://www.heritage.org.nz/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  https://www.heritage.org.nz/
                </Link>
              </PointerEventHandler>
            </PageLink>
          </div>

          <TextSection text="A large content website for Heritage New Zealand Pouhere Taonga" />

          <ImageSection image={hero} type="desktop" />
          <ImageSection image={main} type="default" />

          <TextSection
            text="2023 Best Awards — Large Scale Websites, Bronze."
            link="https://bestawards.co.nz/digital/large-scale-websites/ddb-group-aotearoa-nz/heritage-nz-pouhere-taonga-website/"
            linkText="View on Best Design Awards"
          />

          <div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
            <Title className="">
              <div className="text-primary">Links</div>
            </Title>

            <PageLink className="w-full mt-[2em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://www.heritage.org.nz/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  https://www.heritage.org.nz/
                </Link>
              </PointerEventHandler>
            </PageLink>
            <PageLink className="w-full mt-[0.5em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://bestawards.co.nz/digital/large-scale-websites/ddb-group-aotearoa-nz/heritage-nz-pouhere-taonga-website/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  Best Design Awards — Large Scale Websites
                </Link>
              </PointerEventHandler>
            </PageLink>
          </div>
        </main>
      </SmoothScroll>
    </PageLayer>
  );
}
