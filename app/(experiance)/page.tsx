import GridContainer from '../components/grid';
import Link from '../components/link';
import { TransitionIn } from '../components/transition';
import { HugeTitle, Subtitle } from '../components/typography';

export default function Home() {
  return (
    <TransitionIn>
      <GridContainer asChild className="fixed inset-x-0 top-0 w-full">
        <header>
          <div className="col-start-11">
            <Link href="/about">About</Link>
          </div>
          <div className="col-start-12">
            <Link href="/blog">Blog</Link>
          </div>
        </header>
      </GridContainer>
      <GridContainer asChild>
        <main>
          <HugeTitle className="col-span-6">Featured Projects</HugeTitle>
          <Subtitle className="col-span-3 col-start-1 mt-6">Scroll down to see more</Subtitle>
        </main>
      </GridContainer>
    </TransitionIn>
  );
}
