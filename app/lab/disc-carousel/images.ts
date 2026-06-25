import type { StaticImageData } from "next/image";
import feastShowcaseColour1 from "@/app/projects/feast-mode/assets/cup-showcase/colour-changing-1.png";
import feastShowcaseDetail1 from "@/app/projects/feast-mode/assets/cup-showcase/detail-1.png";
import feastShowcaseMain1 from "@/app/projects/feast-mode/assets/cup-showcase/main-1.png";
import feastModeMain from "@/app/projects/feast-mode/assets/main.png";
import feastSmashGameplay1 from "@/app/projects/feast-mode/cup-smash/gameplay-1.png";
import feastSmashHome1 from "@/app/projects/feast-mode/cup-smash/home-1.png";
import feastSmashResult1 from "@/app/projects/feast-mode/cup-smash/result-1.png";
import folaCards from "@/app/projects/fola/assets/cards.png";
import folaDay from "@/app/projects/fola/assets/day.png";
import folaIntro1 from "@/app/projects/fola/assets/intro-1.png";
import folaListing from "@/app/projects/fola/assets/listing.png";
import folaMain from "@/app/projects/fola/assets/main.png";
import folaNight from "@/app/projects/fola/assets/night.png";
import folaSunset from "@/app/projects/fola/assets/sunset.png";
import greenprintCanvas from "@/app/projects/greenprint/assets/canvas.png";
import greenprintHero from "@/app/projects/greenprint/assets/hero.png";
import greenprintIntro from "@/app/projects/greenprint/assets/intro.png";
import greenprintMain from "@/app/projects/greenprint/assets/main.png";
import greenprintMenu from "@/app/projects/greenprint/assets/menu.png";
import greenprintMobile1 from "@/app/projects/greenprint/assets/mobile-1.png";
import greenprintVw from "@/app/projects/greenprint/assets/vw.png";
import kiwiImage1 from "@/app/projects/kiwi/assets/image-1.png";
import kiwiImage2 from "@/app/projects/kiwi/assets/image-2.png";
import kiwiImage3 from "@/app/projects/kiwi/assets/image-3.png";
import kiwiImage4 from "@/app/projects/kiwi/assets/image-4.png";
import kiwiMain from "@/app/projects/kiwi/assets/main.png";
import watergateAbout1 from "@/app/projects/real-watergate/assets/about-1.png";
import watergateIntro1 from "@/app/projects/real-watergate/assets/intro-1.png";
import watergateMenu from "@/app/projects/real-watergate/assets/menu.png";
import watergateOcean from "@/app/projects/real-watergate/assets/ocean.png";
import watergateSection1 from "@/app/projects/real-watergate/assets/section-1.png";
import watergateSection2 from "@/app/projects/real-watergate/assets/section-2.png";
import reflctDashboard1 from "@/app/projects/reflct/assets/dashboard-1.png";
import reflctDashboard2 from "@/app/projects/reflct/assets/dashboard-2.png";
import reflctDocs from "@/app/projects/reflct/assets/docs.png";
import reflctHome1 from "@/app/projects/reflct/assets/home-1.png";
import reflctMain from "@/app/projects/reflct/assets/main.png";
import reflctShare from "@/app/projects/reflct/assets/share.png";
import typography01 from "@/app/projects/typography/assets/01.png";
import typography02 from "@/app/projects/typography/assets/02.png";
import typography03 from "@/app/projects/typography/assets/03.png";
import typography04 from "@/app/projects/typography/assets/04.png";
import typography05 from "@/app/projects/typography/assets/05.png";
import typography06 from "@/app/projects/typography/assets/06.png";
import typography07 from "@/app/projects/typography/assets/07.png";
import typographyInit from "@/app/projects/typography/assets/init.png";
import typographyMain from "@/app/projects/typography/assets/main.png";
import typographyWave from "@/app/projects/typography/assets/wave.png";

export type CarouselImageItem = {
  image: StaticImageData;
  title: string;
  description: string;
};

export const PROJECT_CAROUSEL_ITEMS = [
  {
    image: reflctMain,
    title: "Reflct",
    description: "3D Gaussian splat platform",
  },
  {
    image: reflctHome1,
    title: "Reflct",
    description: "Project home",
  },
  {
    image: reflctDashboard1,
    title: "Reflct",
    description: "Scene dashboard",
  },
  {
    image: reflctDashboard2,
    title: "Reflct",
    description: "Splat tuning",
  },
  {
    image: reflctDocs,
    title: "Reflct",
    description: "Documentation",
  },
  {
    image: reflctShare,
    title: "Reflct",
    description: "Share embed",
  },
  {
    image: typographyMain,
    title: "Typography",
    description: "Kinetic type collection",
  },
  {
    image: typographyInit,
    title: "Typography",
    description: "Experiment index",
  },
  {
    image: typography01,
    title: "Typography",
    description: "Metaball filters",
  },
  {
    image: typography02,
    title: "Typography",
    description: "Typewriter animation",
  },
  {
    image: typography03,
    title: "Typography",
    description: "Gravity",
  },
  {
    image: typography04,
    title: "Typography",
    description: "2-bit particles",
  },
  {
    image: typography05,
    title: "Typography",
    description: "Wave masks",
  },
  {
    image: typography06,
    title: "Typography",
    description: "Spiral type",
  },
  {
    image: typography07,
    title: "Typography",
    description: "Glowing particles",
  },
  {
    image: typographyWave,
    title: "Typography",
    description: "Wave detail",
  },
  {
    image: kiwiMain,
    title: "Kiwi",
    description: "Interactive kiwi",
  },
  {
    image: kiwiImage1,
    title: "Kiwi",
    description: "Home scene",
  },
  {
    image: kiwiImage2,
    title: "Kiwi",
    description: "Corner bounce",
  },
  {
    image: kiwiImage3,
    title: "Kiwi",
    description: "Fruit theme",
  },
  {
    image: kiwiImage4,
    title: "Kiwi",
    description: "About screen",
  },
  {
    image: folaIntro1,
    title: "Fola",
    description: "Underground intro",
  },
  {
    image: folaMain,
    title: "Fola",
    description: "Digital stage",
  },
  {
    image: folaCards,
    title: "Fola",
    description: "Programme cards",
  },
  {
    image: folaListing,
    title: "Fola",
    description: "Event listing",
  },
  {
    image: folaDay,
    title: "Fola",
    description: "Day gradient",
  },
  {
    image: folaSunset,
    title: "Fola",
    description: "Sunset gradient",
  },
  {
    image: folaNight,
    title: "Fola",
    description: "Night gradient",
  },
  {
    image: greenprintVw,
    title: "Greenprint",
    description: "Volkswagen Kombi",
  },
  {
    image: greenprintIntro,
    title: "Greenprint",
    description: "Intro sequence",
  },
  {
    image: greenprintMain,
    title: "Greenprint",
    description: "EV conversion plans",
  },
  {
    image: greenprintHero,
    title: "Greenprint",
    description: "Hero section",
  },
  {
    image: greenprintCanvas,
    title: "Greenprint",
    description: "Interactive canvas",
  },
  {
    image: greenprintMenu,
    title: "Greenprint",
    description: "Navigation menu",
  },
  {
    image: greenprintMobile1,
    title: "Greenprint",
    description: "Mobile layout",
  },
  {
    image: watergateOcean,
    title: "Real Watergate",
    description: "Ocean shaders",
  },
  {
    image: watergateIntro1,
    title: "Real Watergate",
    description: "Intro sequence",
  },
  {
    image: watergateSection1,
    title: "Real Watergate",
    description: "Evidence papers",
  },
  {
    image: watergateSection2,
    title: "Real Watergate",
    description: "Section scroll",
  },
  {
    image: watergateAbout1,
    title: "Real Watergate",
    description: "About page",
  },
  {
    image: watergateMenu,
    title: "Real Watergate",
    description: "Site menu",
  },
  {
    image: feastModeMain,
    title: "Feast Mode",
    description: "Summer promotion",
  },
  {
    image: feastShowcaseColour1,
    title: "Feast Mode",
    description: "Cup Showcase · colour change",
  },
  {
    image: feastShowcaseDetail1,
    title: "Feast Mode",
    description: "Cup Showcase · detail",
  },
  {
    image: feastShowcaseMain1,
    title: "Feast Mode",
    description: "Cup Showcase · main",
  },
  {
    image: feastSmashHome1,
    title: "Feast Mode",
    description: "Cup Smash · home",
  },
  {
    image: feastSmashGameplay1,
    title: "Feast Mode",
    description: "Cup Smash · gameplay",
  },
  {
    image: feastSmashResult1,
    title: "Feast Mode",
    description: "Cup Smash · result",
  },
] as const satisfies readonly CarouselImageItem[];

function carouselDisplayHeight({ image }: CarouselImageItem) {
  return image.height / image.width;
}

export const CAROUSEL_IMAGES: CarouselImageItem[] = [
  ...PROJECT_CAROUSEL_ITEMS,
].sort((a, b) => carouselDisplayHeight(a) - carouselDisplayHeight(b));

export const CAROUSEL_IMAGE_SRCS = CAROUSEL_IMAGES.map(
  (item) => item.image.src,
);
