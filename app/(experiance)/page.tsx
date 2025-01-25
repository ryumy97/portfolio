import GridContainer from '../components/grid';
import Link from '../components/link';

export default function Home() {
  return (
    <>
      <GridContainer asChild className="absolute inset-x-0 top-0 w-full">
        <header>
          <div className="col-start-12">
            <Link href="/blog">Blog</Link>
          </div>
        </header>
      </GridContainer>
      <GridContainer asChild>
        <main>
          <h1
            className="bg-foreground font-display col-span-6 bg-clip-text text-9xl text-transparent hover:bg-transparent"
            style={{
              WebkitTextStroke: '1px white',
            }}
          >
            Hello World
          </h1>
        </main>
      </GridContainer>
    </>
  );
}
