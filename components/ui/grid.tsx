import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

type Props = {
	className?: string;
	children?: React.ReactNode;
	asChild?: boolean;
	ref?: React.RefObject<HTMLDivElement | null>;
};

export const Grid: React.FC<Props> = ({
	className,
	children,
	asChild,
	ref,
}) => {
	const Comp = asChild ? Slot.Root : "div";

	return (
		<Comp
			className={cn("grid grid-cols-10", className)}
			data-slot="grid"
			data-type="grid"
			ref={ref}
		>
			{children}
		</Comp>
	);
};

export const SubGrid: React.FC<Props> = ({
	className,
	children,
	asChild,
	ref,
}) => {
	const Comp = asChild ? Slot.Root : "div";

	return (
		<Comp
			className={cn("grid grid-cols-subgrid col-span-full", className)}
			data-slot="subgrid"
			data-type="subgrid"
			ref={ref}
		>
			{children}
		</Comp>
	);
};
