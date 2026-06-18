import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import { PageDescription, PageLink, Title } from "@/components/ui/typography";
import { ImageSection, TextSection } from "../section";
import canvas from "./assets/canvas.png";
import end from "./assets/end.png";
import footer from "./assets/footer.png";
import hero from "./assets/hero.png";
import intro from "./assets/intro.png";
import main from "./assets/main.png";
import menu from "./assets/menu.png";
import mobile1 from "./assets/mobile-1.png";
import mobile2 from "./assets/mobile-2.png";
import vw from "./assets/vw.png";

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
              <div className="">Greenprint</div>
              <div className="text-primary mt-[0.3em]">- DDB NZ</div>
            </Title>
            <PageLink className="w-full mt-[1em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://vwgreenprint.co.nz/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  https://vwgreenprint.co.nz/
                </Link>
              </PointerEventHandler>
            </PageLink>
          </div>

          <TextSection text="The Greenprint — an open-source set of plans from Volkswagen New Zealand to turn a classic Kombi into an EV in 20 relatively easy-ish steps." />

          <ImageSection image={intro} type="desktop" />
          <ImageSection image={main} />
          <ImageSection image={vw} />

          <ImageSection image={hero} type="desktop" />

          <TextSection text="A hand-drawn blueprint aesthetic guides owners through each step." />

          <ImageSection image={canvas} type="desktop" />

          <ImageSection image={mobile1} className="w-[60vw] md:w-[20vw]" />
          <ImageSection image={mobile2} className="w-[60vw] md:w-[20vw]" />

          <TextSection text="Owners can download the Greenprint, order a conversion kit, or source parts themselves from an approved list." />

          <ImageSection image={menu} />
          <ImageSection image={footer} />

          <ImageSection image={end} />

          <TextSection
            text="2024 Best Awards — Small Scale Websites, Bronze. Sustainable Product Design (SPD), Gold. Cannes Lions — Silver."
            link="https://bestawards.co.nz/digital/small-scale-websites/ddb-group-aotearoa-nz/vw-greenprint/"
            linkText="View on Best Design Awards"
          />

          <div className="md:max-w-[30vw] max-w-[100vw] w-[80vw]">
            <Title className="">
              <div className="text-primary">Links</div>
            </Title>

            <PageLink className="w-full mt-[2em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://vwgreenprint.co.nz/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  https://vwgreenprint.co.nz/
                </Link>
              </PointerEventHandler>
            </PageLink>
            <PageLink className="w-full mt-[0.5em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://bestawards.co.nz/digital/small-scale-websites/ddb-group-aotearoa-nz/vw-greenprint/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  Best Design Awards — Small Scale Websites
                </Link>
              </PointerEventHandler>
            </PageLink>
            <PageLink className="w-full mt-[0.5em]">
              <PointerEventHandler asChild type="underline">
                <Link
                  href="https://bestawards.co.nz/product/sustainable-product-design-spd/ddb-group-aotearoa-nz/vw-greenprint-1/"
                  target="_blank"
                  className="text-secondary italic"
                >
                  Best Design Awards — Sustainable Product Design
                </Link>
              </PointerEventHandler>
            </PageLink>
          </div>
        </main>
      </SmoothScroll>
    </PageTunnelIn>
  );
}
