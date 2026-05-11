import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

type Props = {
	className?: string;
	children?: React.ReactNode;
	asChild?: boolean;
};

export const Grid: React.FC<Props> = ({ className, children, asChild }) => {
	const Comp = asChild ? Slot.Root : "div";

	return (
		<Comp
			className={cn("grid grid-cols-10", className)}
			data-slot="grid"
			data-type="grid"
		>
			{children}
		</Comp>
	);
};

export const SubGrid: React.FC<Props> = ({ className, children, asChild }) => {
	const Comp = asChild ? Slot.Root : "div";

	return (
		<Comp
			className={cn("grid grid-cols-subgrid col-span-full", className)}
			data-slot="subgrid"
			data-type="subgrid"
		>
			{children}
		</Comp>
	);
};
