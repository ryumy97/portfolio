'use client';

import { View as ViewImpl } from '@react-three/drei';
import { useImperativeHandle, useRef } from 'react';
import { CanvasIn } from './tunnel';
import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & React.PropsWithChildren;

const View = React.forwardRef<HTMLDivElement, Props>(({ children, ...props }, ref) => {
  const localRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

  return (
    <>
      <div ref={localRef} {...props} />
      <CanvasIn>
        <ViewImpl track={localRef as React.RefObject<HTMLDivElement>}>{children}</ViewImpl>
      </CanvasIn>
    </>
  );
});
View.displayName = 'View';

export { View };
