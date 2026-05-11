import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Rodin from "./three/rodin";
import { SubGrid } from "./ui/grid";

const Intro = () => {
	return (
		<SubGrid className="relative h-[calc(100vh-33px)]">
			<h1>Intro</h1>

			<div className="absolute inset-0 z-10">
				<Canvas
					onCreated={({ camera }) => {
						// camera.fov = 28.5;
					}}
				>
					<Rodin />
					<ambientLight intensity={0.8} />
					<directionalLight position={[1, 1, 1]} intensity={0.5} />
					{/* <OrbitControls makeDefault /> */}
					{/* Position: -2.962625911328263, 0.7843018140005457, 3.711369133013187 */}
					{/* Rotation: 0.033795526933088786 -0.4861118293834242 0.01579368944690987 */}
					<PerspectiveCamera
						fov={28.5}
						position={[
							-2.962625911328263, 0.7843018140005457, 3.711369133013187,
						]}
						rotation={[
							0.033795526933088786, -0.4861118293834242, 0.01579368944690987,
						]}
						makeDefault
					/>
				</Canvas>
			</div>
		</SubGrid>
	);
};

export default Intro;
