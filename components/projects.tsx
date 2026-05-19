import earImage from "@/public/about/eye.png";
import { useLenis } from "lenis/react";
import { cubicBezier, motion, transform, useMotionValue } from "motion/react";
import { useRef } from "react";
import { useScrollEvent } from "./smooth-scroll";
import { SubGrid } from "./ui/grid";
import { WebGLPixelationCanvas } from "./webgl/webgl-pixelation-canvas";

const About = () => {
	const lenis = useLenis();
	const ref = useRef<HTMLDivElement>(null);

	const width = useMotionValue("50%");
	const opacity = useMotionValue(1);

	const pixelSize = useMotionValue(64);
	const radius = useMotionValue(1);

	useScrollEvent(() => {
		const top = ref.current?.getBoundingClientRect().top ?? 0;
		const progress = (window.innerHeight - top) / window.innerHeight;

		// width
		const w = transform(progress, [0, 1], [50, 100], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});
		width.set(`${w}%`);

		// opacity
		const op = transform(progress, [0, 1], [1, 0], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});

		opacity.set(op);

		// pixel size
		const px = transform(progress, [0, 1], [64, 24], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});

		pixelSize.set(px);

		// radius
		radius.set(1);
	});

	return (
		<SubGrid className="border-t pt-[10vw] border-primary relative">
			<h1 className="text-[min(max(10vw,18px),32px)] font-heading font-bold leading-[0.8em] tracking-[-0.03em]">
				Projects
			</h1>
			<p className="text-[min(max(10vw,18px),32px)]">I am ....</p>
			<div ref={ref} className="col-span-full aspect-video">
				{/* scroll trigger  */}
				<motion.div
					className="aspect-video w-1/2 mx-auto relative"
					style={{ width }}
				>
					<WebGLPixelationCanvas
						className="absolute inset-0"
						radius={radius}
						pixelSize={pixelSize}
						image={earImage}
					/>
					<motion.div
						className="bg-primary absolute inset-0"
						style={{ opacity }}
					></motion.div>
				</motion.div>
			</div>
		</SubGrid>
	);
};

export default About;
