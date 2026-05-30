"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer } from "@react-three/postprocessing";
import { LightCurtain } from "@/components/three/postprocessing/light-curtain";
import { LIGHT_CURTAIN_EFFECT_DEFAULTS } from "@/components/three/postprocessing/light-curtain-effect";
import Rodin from "@/components/three/rodin";

const START = {
	position: [-3.1, 0, 3.711369133013187] as [number, number, number],
	rotation: [
		0.033795526933088786, -0.4861118293834242, 0.01579368944690987,
	] as [number, number, number],
};

export const LIGHT_CURTAIN_SCENE_DEFAULTS = LIGHT_CURTAIN_EFFECT_DEFAULTS;

export type LightCurtainSceneProps = {
	distortion?: number;
	lightX?: number;
	lightY?: number;
	lightZ?: number;
	fill?: number;
};

export function LightCurtainScene({
	distortion = LIGHT_CURTAIN_SCENE_DEFAULTS.distortion,
	lightX = LIGHT_CURTAIN_SCENE_DEFAULTS.lightX,
	lightY = LIGHT_CURTAIN_SCENE_DEFAULTS.lightY,
	lightZ = LIGHT_CURTAIN_SCENE_DEFAULTS.lightZ,
	fill = LIGHT_CURTAIN_SCENE_DEFAULTS.fill,
}: LightCurtainSceneProps) {
	return (
		<>
			<Rodin position={[0, -1, 0]} />
			<ambientLight intensity={0.1} />
			<directionalLight position={[1, 1, 1]} intensity={2} />
			<OrbitControls />
			<PerspectiveCamera
				fov={28.5}
				position={START.position}
				rotation={START.rotation}
				makeDefault
			/>
			<EffectComposer>
				<LightCurtain
					distortion={distortion}
					lightX={lightX}
					lightY={lightY}
					lightZ={lightZ}
					fill={fill}
				/>
			</EffectComposer>
		</>
	);
}
