import type { StaticImageData } from "next/image";
import image01 from "../../projects/typography/assets/01.png";
import image02 from "../../projects/typography/assets/02.png";
import image03 from "../../projects/typography/assets/03.png";
import image04 from "../../projects/typography/assets/04.png";
import image05 from "../../projects/typography/assets/05.png";
import image06 from "../../projects/typography/assets/06.png";
import image07 from "../../projects/typography/assets/07.png";

export type CarouselImageItem = {
  image: StaticImageData;
  title: string;
  description: string;
};

export const TYPOGRAPHY_CAROUSEL_ITEMS = [
  {
    image: image01,
    title: "Metaball",
    description: "Metaball filters",
  },
  {
    image: image02,
    title: "Typewriter",
    description: "Typewriter animation",
  },
  {
    image: image03,
    title: "Gravity",
    description: "Gravity",
  },
  {
    image: image04,
    title: "2-bit",
    description: "2-bit particles",
  },
  {
    image: image05,
    title: "Wave",
    description: "Wave masks",
  },
  {
    image: image06,
    title: "Koru",
    description: "Spiral type",
  },
  {
    image: image07,
    title: "Fireflies",
    description: "Glowing particles",
  },
] as const satisfies readonly CarouselImageItem[];

const CAROUSEL_REPEAT_COUNT = 4;

export const CAROUSEL_IMAGES = Array.from(
  { length: CAROUSEL_REPEAT_COUNT },
  () => TYPOGRAPHY_CAROUSEL_ITEMS,
).flat() as CarouselImageItem[];

export const CAROUSEL_IMAGE_SRCS = CAROUSEL_IMAGES.map((item) => item.image.src);
