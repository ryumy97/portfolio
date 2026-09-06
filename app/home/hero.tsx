import { Grid } from "@/components/ui/grid";
import { PageDescription, Title } from "@/components/ui/typography";

const Hero = () => {
  return (
    <Grid className="h-svh w-full items-end px-2">
      <div className="col-start-2 col-end-7 py-2 text-ink">
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
      </div>
    </Grid>
  );
};

export default Hero;
