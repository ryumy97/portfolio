import { PageParagraphHeading } from "@/components/ui/typography";

type Props = {
  text: string;
};

const SectionHeader: React.FC<Props> = ({ text }) => {
  return (
    <div className="ml-[5vw] flex items-center justify-start">
      <PageParagraphHeading className="w-[25vw] md:w-[15vw] text-primary font-bold font-heading">
        {text}
      </PageParagraphHeading>
      <PageParagraphHeading className="w-[25vw] md:w-[10vw] text-primary font-bold font-heading">
        |
      </PageParagraphHeading>
    </div>
  );
};

export default SectionHeader;
