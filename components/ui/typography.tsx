import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

type Props = {
	className?: string;
	asChild?: boolean;
} & React.PropsWithChildren;

export const Title: React.FC<Props> = ({ children, className, asChild }) => {
	const Comp = asChild ? Slot.Root : "h1";

	return (
		<Comp
			className={cn(
				"text-[min(max(6vw,18px),32px)] font-heading font-bold leading-[0.8em] tracking-[-0.03em]",
				className,
			)}
		>
			{children}
		</Comp>
	);
};

export const SectionDescription: React.FC<Props> = ({
	children,
	className,
	asChild,
}) => {
	const Comp = asChild ? Slot.Root : "p";

	return (
		<Comp
			className={cn(
				"text-[min(max(5vw,18px),28px)] leading-[1.1em]",
				className,
			)}
		>
			{children}
		</Comp>
	);
};

export const PageDescription: React.FC<Props> = ({
	children,
	className,
	asChild,
}) => {
	const Comp = asChild ? Slot.Root : "p";

	return (
		<Comp
			className={cn(
				"text-[min(max(2.5vw,14px),24px)] leading-[1.25em]",
				className,
			)}
		>
			{children}
		</Comp>
	);
};

export const PageLink: React.FC<Props> = ({ children, className, asChild }) => {
	const Comp = asChild ? Slot.Root : "div";

	return (
		<Comp
			className={cn(
				"text-[min(max(1vw,12px),13px)] leading-[1.25em] italic text-secondary",
				className,
			)}
		>
			{children}
		</Comp>
	);
};

export const PageParagraphHeading: React.FC<Props> = ({
	children,
	className,
	asChild,
}) => {
	const Comp = asChild ? Slot.Root : "p";

	return (
		<Comp
			className={cn(
				"text-[min(max(2.5vw,18px),24px)] leading-[1.25em]",

				className,
			)}
		>
			{children}
		</Comp>
	);
};

export const CVHeading: React.FC<Props> = ({
	children,
	className,
	asChild,
}) => {
	const Comp = asChild ? Slot.Root : "p";

	return (
		<Comp
			className={cn(
				"text-[min(max(2vw,18px),20px)] leading-[1.25em] font-heading",
				className,
			)}
		>
			{children}
		</Comp>
	);
};

export const CVSubHeading: React.FC<Props> = ({
	children,
	className,
	asChild,
}) => {
	const Comp = asChild ? Slot.Root : "p";

	return (
		<Comp
			className={cn(
				"text-[min(max(1vw,12px),13px)] leading-[1.25em] font-mono",
				className,
			)}
		>
			{children}
		</Comp>
	);
};

export const CVLink: React.FC<Props> = ({ children, className, asChild }) => {
	const Comp = asChild ? Slot.Root : "span";

	return (
		<Comp
			className={cn(
				"text-[min(max(1vw,12px),13px)] leading-[1.25em] italic text-secondary",
				className,
			)}
		>
			{children}
		</Comp>
	);
};

export const CVList: React.FC<Props> = ({ children, className, asChild }) => {
	const Comp = asChild ? Slot.Root : "ul";

	return (
		<Comp className={cn("list-disc list-inside ml-2", className)}>
			{children}
		</Comp>
	);
};

export const CVListItem: React.FC<Props> = ({
	children,
	className,
	asChild,
}) => {
	const Comp = asChild ? Slot.Root : "li";

	return (
		<Comp
			className={cn(
				"text-[min(max(1vw,12px),13px)] leading-[1.5em]",
				className,
			)}
		>
			{children}
		</Comp>
	);
};

export const CVSubList: React.FC<Props> = ({
	children,
	className,
	asChild,
}) => {
	const Comp = asChild ? Slot.Root : "ul";

	return (
		<Comp className={cn("list-[circle] list-inside ml-4", className)}>
			{children}
		</Comp>
	);
};

export const CVSubSubList: React.FC<Props> = ({
	children,
	className,
	asChild,
}) => {
	const Comp = asChild ? Slot.Root : "ul";

	return (
		<Comp className={cn("list-[square] list-inside ml-4", className)}>
			{children}
		</Comp>
	);
};

export const ProjectTitle: React.FC<Props> = ({
	children,
	className,
	asChild,
}) => {
	const Comp = asChild ? Slot.Root : "h2";

	return (
		<Comp
			className={cn(
				"text-[min(max(4vw,32px),80px)] leading-[1.25em] font-heading font-bold tracking-[-0.03em]",
				className,
			)}
		>
			{children}
		</Comp>
	);
};
