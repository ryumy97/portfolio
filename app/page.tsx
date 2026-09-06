import Hero from "@/app/home/hero";
import PageLayer from "@/components/page-layer";
import SmoothScroll from "@/components/smooth-scroll";
import Footer from "./home/footer";
import Intro from "./home/intro";

export default function Page() {
  return (
    <PageLayer>
      <SmoothScroll>
        <main className="text-ink">
          <Hero />
          <Intro />
          <Footer />
        </main>
      </SmoothScroll>
    </PageLayer>
  );
}
