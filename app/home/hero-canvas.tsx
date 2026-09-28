"use client";

import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import HomeHeadScene from "@/components/three/scene/home-head-scene";

const HeroCanvas = () => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas eventSource={ref.current ?? undefined} frameloop="demand">
        <HomeHeadScene />
      </Canvas>
    </div>
  );
};

export default HeroCanvas;
