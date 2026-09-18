import PageLayer from "@/components/page-layer";
import { Grid } from "@/components/ui/grid";
import { Title } from "@/components/ui/typography";
import dynamic from "next/dynamic";
import Foreground from "./notfound/foreground";

const Background = dynamic(() =>
  import("./notfound/background").then((mod) => mod.default),
);

export default function NotFoundPage() {
  return (
    <PageLayer>
      <Grid className="relative min-h-svh pt-20">
        <Background />
        <Foreground />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Title className="text-primary text-[30vw] leading-none tracking-[-0.03em]">
            404
          </Title>
        </div>
      </Grid>
    </PageLayer>
  );
}
