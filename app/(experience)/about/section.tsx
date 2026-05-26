import { PointerEventHandler } from "@/components/pointer";
import { CVHeading, CVLink, CVSubHeading } from "@/components/ui/typography";
import Link from "next/link";
import { PropsWithChildren } from "react";

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
			<CVLink asChild>
				<PointerEventHandler asChild type="underline">
					<Link href={link} target="_blank">
						{link}
					</Link>
				</PointerEventHandler>
			</CVLink>
			{children}
		</div>
	);
};

export const SubSection: React.FC<PropsWithChildren> = ({ children }) => {
	return <div className="max-w-[100vw] md:max-w-[30vw] w-full">{children}</div>;
};

export default Section;
