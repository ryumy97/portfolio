'use client';

import NextLink, { LinkProps } from 'next/link';
import { useRef } from 'react';
import { useCursor } from './cursor';

type Props = LinkProps & React.PropsWithChildren & React.HTMLAttributes<HTMLAnchorElement>;

const Link = ({ children, className, ...props }: Props) => {
  const ref = useRef<HTMLAnchorElement>(null);

  useCursor(ref);

  return (
    <NextLink className={className} {...props} ref={ref}>
      {children}
    </NextLink>
  );
};

export default Link;
