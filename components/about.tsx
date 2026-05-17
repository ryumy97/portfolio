import { useRef } from "react";
import { SubGrid } from "./ui/grid";

import { useLenis } from "lenis/react";
import { cubicBezier, motion, transform, useMotionValue } from "motion/react";

const About = () => {
	const lenis = useLenis();
	const ref = useRef<HTMLDivElement>(null);

	const width = useMotionValue("50%");

	lenis?.on("scroll", (event) => {
		const top = ref.current?.getBoundingClientRect().top ?? 0;
		const progress = (window.innerHeight - top) / window.innerHeight;
		const value = transform(progress, [0, 1], [50, 100], {
			clamp: true,
			ease: cubicBezier(0.3, 0, 0, 1),
		});
		width.set(`${value}%`);

		// const progress = event.actualScroll / window.innerHeight;
		// width.set(progress * 100 + "%");
	});

	return (
		<SubGrid className="border-t pt-[10vw] border-primary relative">
			<h1 className="text-[min(max(10vw,18px),32px)] font-heading font-bold leading-[0.8em] tracking-[-0.03em]">
				In Ha Ryu
			</h1>
			<p className="text-[min(max(10vw,18px),32px)]">I create websites.</p>
			<div ref={ref} className="col-span-full aspect-video">
				{/* scroll trigger  */}
				<motion.div
					className="bg-primary aspect-video w-1/2 mx-auto"
					style={{ width }}
				></motion.div>
			</div>
		</SubGrid>
	);
};

export default About;
