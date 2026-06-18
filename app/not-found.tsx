import { PageTunnelIn } from "@/components/page-tunnel";
import { Grid } from "@/components/ui/grid";
import { Title } from "@/components/ui/typography";
import Background from "./notfound/background";
import Foreground from "./notfound/foreground";

export default function NotFoundPage() {
  return (
    <PageTunnelIn>
      <Grid className="min-h-screen pt-20">
        <Background />
        <Foreground />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Title className="text-primary text-[30vw] leading-none tracking-[-0.03em]">
            404
          </Title>
        </div>
      </Grid>
    </PageTunnelIn>
  );
}
