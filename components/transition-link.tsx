"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";

const TransitionLink = (props: ComponentProps<typeof NextLink>) => {
  return <NextLink {...props} />;
};

export default TransitionLink;
