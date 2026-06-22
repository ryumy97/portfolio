export type LabEntry = {
  href: string;
  title: string;
};

export type LabSubcategory = {
  title: string;
  labs: readonly LabEntry[];
};

export type LabCategory = {
  title: string;
  labs?: readonly LabEntry[];
  subcategories?: readonly LabSubcategory[];
};

export const LAB_CATEGORIES = [
  {
    title: "Gaussian Splatting",
    labs: [
      { href: "/lab/gaussian-splat/reveal", title: "Reveal" },
      { href: "/lab/gaussian-splat/vortex", title: "Vortex" },
    ],
  },
  {
    title: "Three.js",
    subcategories: [
      {
        title: "Scene",
        labs: [
          {
            href: "/lab/particle-morphing/image",
            title: "Particles - Image Morph",
          },
          {
            href: "/lab/particle-morphing/surface",
            title: "Particles - Surface Morph",
          },
          { href: "/lab/clip-surface", title: "Clip Surface" },
          { href: "/lab/flower-tunnel", title: "Flower Tunnel" },
        ],
      },
      {
        title: "Post-processing",
        labs: [
          { href: "/lab/light-curtain", title: "Light Curtain" },
          { href: "/lab/stagged", title: "Staggered" },
        ],
      },
    ],
  },
  {
    title: "WebGL shaders",
    labs: [
      { href: "/lab/cmyk", title: "CMYK" },
      { href: "/lab/neighbor", title: "Neighbor" },
      { href: "/lab/ripple-dots", title: "Ripple Dots" },
      { href: "/lab/ripple-gradient", title: "Ripple Gradient" },
      { href: "/lab/pixelation", title: "Pixelation" },
    ],
  },
  {
    title: "2D canvas",
    labs: [
      { href: "/lab/image-bubble", title: "Image Bubble" },
      { href: "/lab/sticky-note", title: "Sticky Note" },
    ],
  },
] as const satisfies readonly LabCategory[];
