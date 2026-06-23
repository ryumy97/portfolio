import { Canvas } from "@react-three/fiber";
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
  return (
    <>
      <Canvas
        className="absolute inset-0 h-full w-full touch-none"
        frameloop="always"
      >
        <DiscCarouselScene />
      </Canvas>
      <DebugCanvasTexture />
    </>
  );
};

export default DiscCarouselCanvas;
