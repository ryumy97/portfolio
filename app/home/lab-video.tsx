import { PointerEventHandler } from "@/components/pointer";
import SplitText from "@/components/split-text";
import { Grid } from "@/components/ui/grid";
import { PageDescription, Title } from "@/components/ui/typography";
import Link from "next/link";

const LabVideo = () => {
  return (
    <Grid className="relative w-full px-2 py-8 md:h-svh">
      <video
        className="col-start-2 col-end-9 md:col-start-7 md:col-end-12 h-auto w-full md:sticky top-20"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Lab experiments"
      >
        <source src="/videos/lab.webm" type="video/webm" />
        <source src="/videos/lab.mp4" type="video/mp4" />
        <source src="/videos/lab.mov" type="video/quicktime" />
      </video>
      <div className="pt-20 col-start-2 col-end-9 md:col-end-7">
        <PointerEventHandler type="bullet" asChild>
          <Title className="text-coral" asChild>
            <Link href="/lab">Lab</Link>
          </Title>
        </PointerEventHandler>

        <PageDescription className="mt-2">
          <SplitText>
            I like to explore the web development by building experiments and
            prototypes. Range of experiments using technologies such as Gaussian
            Splatting, Three.js, WebGL shaders, and canvas 2D.
          </SplitText>
        </PageDescription>
      </div>
    </Grid>
  );
};

export default LabVideo;
