import Hero from "@/app/home/hero";
import PageLayer from "@/components/page-layer";
import SmoothScroll from "@/components/smooth-scroll";
import Footer from "./home/footer";
import Intro from "./home/intro";
import LabVideo from "./home/lab-video";

export default function Page() {
  return (
    <PageLayer>
      <SmoothScroll>
        <main className="text-ink">
          <Hero />
          <Intro />
          <hr className="border-coral my-12 mx-2" />
          <LabVideo />
          <Footer />
        </main>
      </SmoothScroll>
    </PageLayer>
  );
}
