"use client";

import { useLayoutEffect, useState } from "react";

const MD_UP = "(min-width: 768px)";

export function useMdUp() {
  const [mdUp, setMdUp] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia(MD_UP);
    const update = () => setMdUp(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return mdUp;
}
