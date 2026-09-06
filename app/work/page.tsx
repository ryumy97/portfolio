import PageLayer from "@/components/page-layer";
import SmoothScroll from "@/components/smooth-scroll";
import { Title } from "@/components/ui/typography";
import aimhigh from "./aimhigh/assets/main.png";
import feastMode from "./feast-mode/assets/main.png";
import fola from "./fola/assets/cards.png";
import greenprint from "./greenprint/assets/vw.png";
import heritage from "./heritage-new-zealand/assets/hero.png";
import kiwi from "./kiwi/assets/main.png";
import realWatergate from "./real-watergate/assets/ocean.png";
import reflct from "./reflct/assets/main.png";
import { ListItemSection } from "./section";
import typography from "./typography/assets/main.png";

export default function Page2() {
  return (
    <PageLayer>
      <SmoothScroll horizontal>
        <main className="flex min-h-svh w-max items-center gap-[10vw] md:gap-[5vw] px-8">
          <div className="md:max-w-[30vw] max-w-[100vw] w-screen">
            <Title className="">
              <div className="text-primary">Work</div>
            </Title>
          </div>
          {/* Reflct */}
          <ListItemSection title="Reflct" image={reflct} link="/work/reflct" />
          {/* Typography */}
          <ListItemSection
            title="Typography"
            image={typography}
            link="/work/typography"
          />
          {/* Kiwi */}
          <ListItemSection title="Kiwi" image={kiwi} link="/work/kiwi" />
          {/* Aim High */}
          <ListItemSection
            title="Aim High"
            image={aimhigh}
            link="/work/aimhigh"
          />
          {/* Fola */}
          <ListItemSection title="Fola" image={fola} link="/work/fola" />
          {/* Greenprint */}
          <ListItemSection
            title="Greenprint"
            image={greenprint}
            link="/work/greenprint"
          />
          {/* Real Watergate */}
          <ListItemSection
            title="Real Watergate"
            image={realWatergate}
            link="/work/real-watergate"
          />
          {/* Heritage New Zealand */}
          <ListItemSection
            title="Heritage NZ"
            image={heritage}
            link="/work/heritage-new-zealand"
          />
          {/* Feast mode */}
          <ListItemSection
            title="Feast Mode"
            image={feastMode}
            link="/work/feast-mode"
          />
        </main>
      </SmoothScroll>
    </PageLayer>
  );
}
