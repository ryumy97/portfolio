import Link from "next/link";
import type { PropsWithChildren } from "react";
import { PointerEventHandler } from "@/components/pointer";
import { CVHeading, CVLink, CVSubHeading } from "@/components/ui/typography";

type Props = {
	subtitle: string;
	title: React.ReactNode;
	link: string;
} & React.PropsWithChildren;

const Section: React.FC<Props> = ({ subtitle, title, link, children }) => {
	return (
		<div className="max-w-[100vw] md:max-w-[30vw] w-full">
			<CVSubHeading className="text-primary">{subtitle}</CVSubHeading>
			<CVHeading>{title}</CVHeading>
			<PointerEventHandler asChild type="underline">
				<CVLink asChild>
					<Link href={link} target="_blank">
						{link}
					</Link>
				</CVLink>
			</PointerEventHandler>
			{children}
		</div>
	);
};

export const SubSection: React.FC<PropsWithChildren> = ({ children }) => {
	return <div className="max-w-[100vw] md:max-w-[30vw] w-full">{children}</div>;
};

export const ProjectLink: React.FC<PropsWithChildren & { link: string }> = ({
	children,
	link,
}) => {
	return (
		<PointerEventHandler asChild type="bullet" offsetX={-8} offsetY={1}>
			<Link href={link} className="relative">
				<span className="absolute top-1/2 left-0 translate-x-[calc(-100%-4px)] -translate-y-[calc(50%-1px)] w-2 h-2 bg-secondary rounded-full"></span>
				{children}
			</Link>
		</PointerEventHandler>
	);
};

export default Section;
