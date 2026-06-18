import Hero from "@/app/home/hero";
import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import { Grid, SubGrid } from "@/components/ui/grid";
import Footer from "./home/footer";
import Main from "./home/main";

export default function Home() {
  return (
    <PageTunnelIn>
      <SmoothScroll>
        <Grid>
          <SubGrid asChild>
            <main className="px-2">
              <Hero />
              <Main />
            </main>
          </SubGrid>
          <Footer />
        </Grid>
      </SmoothScroll>
    </PageTunnelIn>
  );
}
