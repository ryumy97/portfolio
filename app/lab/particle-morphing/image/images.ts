import type { StaticImageData } from "next/image";
import bird from "./assets/bird.png";
import flower1 from "./assets/flower1.png";
import flower2 from "./assets/flower2.png";
import flower3 from "./assets/flower3.png";
import flower4 from "./assets/flower4.png";

export const IMAGE_PARTICLE_IMAGES = [
  bird,
  flower1,
  flower2,
  flower3,
  flower4,
] as const satisfies readonly StaticImageData[];
