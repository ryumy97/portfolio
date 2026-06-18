import * as THREE from "three";

export const TUNNEL_TEXTURE_SETS = 4;
export const TUNNEL_TEXTURES_PER_SET = 4;
export const TUNNEL_DISTANCE_NEAR = 2.5;
export const TUNNEL_DISTANCE_FAR = 6;
export const TUNNEL_CAMERA_FOV = 60;
export const TUNNEL_TEXTURE_BRIGHTNESS = 2.1;
export const TUNNEL_TEXTURE_GLOW = 0.28;

export function configureTunnelTextureAtlas(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
}
