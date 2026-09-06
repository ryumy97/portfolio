import SplitText from "@/components/split-text";
import { Grid } from "@/components/ui/grid";
import { PageDescription } from "@/components/ui/typography";

const Intro = () => {
  return (
    <Grid className="w-full items-center px-2 py-8">
      <PageDescription className="col-start-2 col-end-7">
        <SplitText>
          Hi, I'm In Ha, a frontend developer based in Auckland, New Zealand.
          Welcome to my portfolio site. Here you can find more about me and my
          work, and many things that I'm exploring.
          <br />
          <br />
          My passion is to build experiences that are joyful to use. Whether
          that is a campaign experience, a website, or a web products, I want to
          make sure that the user feels the joy of using the product.
          <br />
          <br />
          Therefore my learning lean towards building and crafting{" "}
          <i>Animations</i>, <i>CSS</i> <i>3D</i>, <i>WebGL</i> and
          <i> shaders</i> - which I believe that are the future of web
          development.
          <br />
          <br />
          Feel free to reach out to me at{" "}
          <a href="mailto:inha.ryu@gmail.com" className="underline">
            inha.ryu@gmail.com
          </a>
        </SplitText>
      </PageDescription>
    </Grid>
  );
};

export default Intro;
