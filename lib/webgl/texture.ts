import { getImageProps, type StaticImageData } from "next/image";

export function getOptimizedImageSrc(
  image: StaticImageData,
  width: number,
  height: number,
  quality: number,
) {
  const { props } = getImageProps({
    alt: "",
    src: image,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    quality,
  });
  return props.src;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function uploadTextureFromImage(
  gl: WebGLRenderingContext,
  image: HTMLImageElement,
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return texture;
}

export async function loadOptimizedImages(
  images: StaticImageData[],
  width: number,
  height: number,
  quality: number,
) {
  const srcs = images.map((image) =>
    getOptimizedImageSrc(image, width, height, quality),
  );
  return Promise.all(srcs.map(loadImage));
}
