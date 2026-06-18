import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, PageLink, Title } from "@/components/ui/typography";
import { ImageSection, TextSection } from "../section";
import cards from "./assets/cards.png";
import day from "./assets/day.png";
import intro1 from "./assets/intro-1.png";
import intro2 from "./assets/intro-2.png";
import intro3 from "./assets/intro-3.png";
import listing from "./assets/listing.png";
import main from "./assets/main.png";
import night from "./assets/night.png";
import sunset from "./assets/sunset.png";
import transition from "./assets/transition.png";

export default function Page() {
  return (
    <PageTunnelIn>
      <SmoothScroll horizontal>
        <PageDescription className="absolute bottom-4 right-4 flex items-center gap-[1vw] justify-center">
          Scroll this way{" "}
          <ArrowRightIcon className="w-[min(max(2vw,16px),24px)]" />
        </PageDescription>

        <main className="flex min-h-screen w-max items-center gap-[10vw] md:gap-[5vw] px-8">
          <div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
            <Title className="">
              <div className="">Fola</div>
              <div className="text-primary mt-[0.3em]">- DDB NZ</div>
            </Title>
            <PageLink className="w-full mt-[1em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://www.folaakl.co.nz/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  https://www.folaakl.co.nz/
                </Link>
              </PointerEventHandler>
            </PageLink>
          </div>

          <TextSection text="Website for F.O.L.A. [AKL] — Festival of Live Art, a biennial celebration of experimental and live art in Tāmaki Makaurau." />

          <ImageSection image={intro1} type="desktop" />
          <ImageSection image={intro2} />
          <ImageSection image={intro3} />

          <TextSection text="An intro sequence welcomes visitors underground, followed by a living digital stage that shifts with each festival edition." />

          <ImageSection image={main} />

          <ImageSection image={cards} type="desktop" />
          <ImageSection image={listing} type="desktop" />

          <TextSection text="The experience localises to Tāmaki Makaurau — gradient and audio shift from sunrise to moonlight." />

          <ImageSection image={day} />
          <ImageSection image={sunset} />
          <ImageSection image={night} />

          <ImageSection image={transition} />

          <TextSection
            text="2025 Best Awards — Small Scale Websites, Silver."
            link="https://bestawards.co.nz/digital/small-scale-websites/ddb-group-aotearoa-nz/fola-festival-of-live-art/"
            linkText="View on Best Design Awards"
          />

          <div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
            <Title className="">
              <div className="text-primary">Links</div>
            </Title>

            <PageLink className="w-full mt-[2em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://www.folaakl.co.nz/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  https://www.folaakl.co.nz/
                </Link>
              </PointerEventHandler>
            </PageLink>
            <PageLink className="w-full mt-[0.5em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://bestawards.co.nz/digital/small-scale-websites/ddb-group-aotearoa-nz/fola-festival-of-live-art/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  Best Design Awards — F.O.L.A.
                </Link>
              </PointerEventHandler>
            </PageLink>
          </div>
        </main>
      </SmoothScroll>
    </PageTunnelIn>
  );
}
