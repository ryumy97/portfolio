"use client";

import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import HeadScene from "@/components/three/scene/head-scene";

const Background = () => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas eventSource={ref.current ?? undefined} frameloop="demand">
        <HeadScene />
      </Canvas>
    </div>
  );
};

export default Background;
