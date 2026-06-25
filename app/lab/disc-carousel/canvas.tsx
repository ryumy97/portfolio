import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { DiscCarouselScene } from "./scene";

const DebugCanvasTexture = () => {
  return (
    <canvas
      data-texture-id="line-texture"
      className="absolute bottom-0 left-0 h-[300px] w-[300px]"
    />
  );
};

const DiscCarouselCanvas = () => {
  const unselectRef = useRef<(() => void) | null>(null);

  return (
    <>
      <Canvas
        className="absolute inset-0 h-full w-full touch-none"
        frameloop="always"
        onPointerMissed={() => unselectRef.current?.()}
      >
        <DiscCarouselScene
          onRegisterUnselect={(unselect) => {
            unselectRef.current = unselect;
          }}
        />
      </Canvas>
      <DebugCanvasTexture />
    </>
  );
};

export default DiscCarouselCanvas;
