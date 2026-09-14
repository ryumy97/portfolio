import { Grid } from "@/components/ui/grid";
import { PageDescription, Title } from "@/components/ui/typography";

const Hero = () => {
  return (
    <Grid className="h-svh w-full px-2 grid-rows-[1fr_auto]">
      <div className="relative col-start-2 col-end-9 md:col-end-7 min-h-0 overflow-hidden"></div>
      <div className="col-start-2 col-end-9 md:col-end-7 py-2 text-ink mt-4">
        <Title>In Ha Ryu</Title>
        <PageDescription className="mt-4">
          <span>
            Cogito
            <span className={"text-primary"}>,</span>{" "}
          </span>
          <span>
            ergo sum
            <span className={"text-primary"}>.</span>
          </span>
        </PageDescription>
        <hr className="mt-4 border-primary" />
      </div>
    </Grid>
  );
};

export default Hero;
