import { PageParagraphHeading } from "@/components/ui/typography";

type Props = {
  text: string;
};

const SectionHeader: React.FC<Props> = ({ text }) => {
  return (
    <PageParagraphHeading className="pt-8 first:pt-0 text-primary font-bold font-heading">
      {text}
    </PageParagraphHeading>
  );
};

export default SectionHeader;
