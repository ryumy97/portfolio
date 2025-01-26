'use client';

import { Canvas } from '@react-three/fiber';
import Cursor from '../components/cursor';
import { TransitionOut } from '../components/transition';
import { CanvasOut } from '../components/canvas/tunnel';
import { useRef } from 'react';
import { Preload } from '@react-three/drei';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="bg-background absolute inset-0 overflow-hidden"
      style={{
        width: ' 100%',
        height: '100%',
        overflow: 'auto',
        touchAction: 'auto',
      }}
    >
      {children}
      <TransitionOut />
      {/* <Intro /> */}
      <Canvas
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        eventSource={ref as React.RefObject<HTMLDivElement>}
        eventPrefix="client"
      >
        <CanvasOut />
        <Preload all />
      </Canvas>
      <Cursor />
    </div>
  );
};

export default Layout;
