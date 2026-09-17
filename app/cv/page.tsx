import PageLayer from "@/components/page-layer";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import Link from "@/components/transition-link";
import { Grid } from "@/components/ui/grid";
import {
  CVDescription,
  CVHeading,
  CVLink,
  CVList,
  CVListItem,
  CVSubHeading,
  CVSubList,
  PageDescription,
  Title,
} from "@/components/ui/typography";
import GithubIcon from "./assets/github.svg";
import LinkedinIcon from "./assets/linkedin.svg";
import { ProjectLink } from "./section";
import SectionHeader from "./section-header";

export default function Page() {
  return (
    <PageLayer>
      <SmoothScroll>
        <main>
          <Grid className="h-svh w-full items-end px-2">
            <div className="col-start-2 col-end-9 md:col-end-7 py-2">
              <Title>
                <div className="text-primary">CV</div>
                <div className="mt-2">In Ha Ryu</div>
              </Title>
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
              <div className="flex flex-col mt-4">
                <CVSubHeading className="text-muted-foreground">
                  Auckland, New Zealand
                </CVSubHeading>
                <div className="flex items-center gap-2 mt-2">
                  <PointerEventHandler type="underline" asChild>
                    <Link href="https://github.com/ryumy97" target="_blank">
                      <GithubIcon className="w-6 h-6" />
                    </Link>
                  </PointerEventHandler>
                  <PointerEventHandler type="underline" asChild>
                    <Link
                      href="https://www.linkedin.com/in/in-ha-ryu-775398147/"
                      target="_blank"
                    >
                      <LinkedinIcon className="w-6 h-6 mt-0.5" />
                    </Link>
                  </PointerEventHandler>
                </div>
                <div className="mt-1">
                  <PointerEventHandler type="underline" asChild>
                    <CVLink>
                      <Link href={"tel:+642102831932"} target="_blank">
                        (+64) 21 028 31932
                      </Link>
                    </CVLink>
                  </PointerEventHandler>
                </div>
                <div>
                  <PointerEventHandler type="underline" asChild>
                    <CVLink>
                      <Link
                        href={"mailto:INHA.RYU.97@GMAIL.COM"}
                        target="_blank"
                      >
                        INHA.RYU.97@GMAIL.COM
                      </Link>
                    </CVLink>
                  </PointerEventHandler>
                </div>
                <div>
                  <PointerEventHandler type="underline" asChild>
                    <CVLink>
                      <Link href="/CV.pdf" target="_blank">
                        Download CV
                      </Link>
                    </CVLink>
                  </PointerEventHandler>
                </div>
              </div>
            </div>
          </Grid>

          <Grid className="w-full px-2 py-16">
            <div className="col-start-2 col-end-9 md:col-end-7 flex flex-col gap-12 pb-16">
              <SectionHeader text="Personal" />

              {/* Reflct */}
              <div className="w-full">
                <CVSubHeading className="text-primary">
                  AUG 2024 - PRESENT
                </CVSubHeading>
                <CVHeading>
                  <ProjectLink link="/work/reflct">
                    <b>Reflct</b>
                  </ProjectLink>
                  <i>- Co founder & Developer</i>
                </CVHeading>
                <PointerEventHandler asChild type="underline">
                  <CVLink>
                    <Link href={"https://www.reflct.app/"} target="_blank">
                      {"https://www.reflct.app/"}
                    </Link>
                  </CVLink>
                </PointerEventHandler>

                <CVDescription>
                  Designed, built and launched a web platform featuring a 3D
                  Gaussian splat scene editor as well as a published npm package
                  as an embeddable viewer library in React. This includes
                  full-stack architecture of uploading and transforming 3DGS
                  data to DB and blob storage, user authentication, payment
                  integration of a subscription model, implementing a cache
                  layer, end-to-end testing and a CI/CD pipeline of both the web
                  app and packages.
                </CVDescription>
                <CVList className="mt-2">
                  <CVListItem>
                    A platform to easily manage and deploy 3D Gaussian Splatting
                    (3DGS) scenes into the website.
                  </CVListItem>
                  <CVListItem>
                    Next.js, React, Playcanvas, WebGL, Lerna, Clerk, Stripe,
                    Hono, Redis, Prisma, PostgreSQL, S3, Playwright, CI/CD.
                  </CVListItem>
                  <CVListItem>
                    @reflct/react npm package -
                    <CVSubList>
                      <CVListItem>
                        <PointerEventHandler asChild type="underline">
                          <CVLink>
                            <Link
                              href="https://www.npmjs.com/package/@reflct/react"
                              target="_blank"
                            >
                              https://www.npmjs.com/package/@reflct/react
                            </Link>
                          </CVLink>
                        </PointerEventHandler>
                      </CVListItem>
                    </CVSubList>
                  </CVListItem>
                  <CVListItem>
                    Github -
                    <CVSubList>
                      <CVListItem>
                        <PointerEventHandler asChild type="underline">
                          <CVLink>
                            <Link
                              href="https://github.com/Reflct"
                              target="_blank"
                            >
                              https://github.com/Reflct
                            </Link>
                          </CVLink>
                        </PointerEventHandler>
                      </CVListItem>
                    </CVSubList>
                  </CVListItem>
                  <CVListItem>
                    Youtube -
                    <CVSubList>
                      <CVListItem>
                        <PointerEventHandler asChild type="underline">
                          <CVLink>
                            <Link
                              href="https://www.youtube.com/channel/UCVVFVZrukfeW6yQ_Scx1Eeg"
                              target="_blank"
                            >
                              https://www.youtube.com/channel/UCVVFVZrukfeW6yQ_Scx1Eeg
                            </Link>
                          </CVLink>
                        </PointerEventHandler>
                      </CVListItem>
                    </CVSubList>
                  </CVListItem>
                </CVList>
              </div>

              {/* Typography */}
              <div className="w-full">
                <CVSubHeading className="text-primary">2022</CVSubHeading>
                <CVHeading>
                  <ProjectLink link="/work/typography">
                    <b>Typography</b>
                  </ProjectLink>
                </CVHeading>
                <PointerEventHandler asChild type="underline">
                  <CVLink>
                    <Link
                      href={"https://typography.ryumy.com/"}
                      target="_blank"
                    >
                      {"https://typography.ryumy.com/"}
                    </Link>
                  </CVLink>
                </PointerEventHandler>

                <CVList className="mt-2">
                  <CVListItem>
                    Mini project holding a collection of interactive
                    experiences.
                  </CVListItem>
                  <CVListItem>
                    Simple HTML5, Javascript, CSS, Pixi.JS
                  </CVListItem>
                  <CVListItem>
                    Github -
                    <CVSubList>
                      <CVListItem>
                        <PointerEventHandler asChild type="underline">
                          <CVLink>
                            <Link
                              href="https://github.com/ryumy97/typography"
                              target="_blank"
                            >
                              https://github.com/ryumy97/typography
                            </Link>
                          </CVLink>
                        </PointerEventHandler>
                      </CVListItem>
                    </CVSubList>
                  </CVListItem>
                </CVList>
              </div>

              {/* Kiwi */}
              <div className="w-full">
                <CVSubHeading className="text-primary">2021</CVSubHeading>
                <CVHeading>
                  <ProjectLink link="/work/kiwi">
                    <b>Kiwi</b>
                  </ProjectLink>
                </CVHeading>
                <PointerEventHandler asChild type="underline">
                  <CVLink>
                    <Link href={"https://kiwi.ryumy.com/"} target="_blank">
                      {"https://kiwi.ryumy.com/"}
                    </Link>
                  </CVLink>
                </PointerEventHandler>

                <CVList className="mt-2">
                  <CVListItem>
                    A simple interactive environment without any external
                    libraries.
                  </CVListItem>
                  <CVListItem>Simple HTML5, Javascript, CSS</CVListItem>
                  <CVListItem>
                    Github -
                    <CVSubList>
                      <CVListItem>
                        <PointerEventHandler asChild type="underline">
                          <CVLink>
                            <Link
                              href="https://github.com/ryumy97/kiwi"
                              target="_blank"
                            >
                              https://github.com/ryumy97/kiwi
                            </Link>
                          </CVLink>
                        </PointerEventHandler>
                      </CVListItem>
                    </CVSubList>
                  </CVListItem>
                </CVList>
              </div>

              {/* Aim High Charitable Trust */}
              <div className="w-full">
                <CVSubHeading className="text-primary">2020</CVSubHeading>
                <CVHeading>
                  <ProjectLink link="/work/aimhigh">
                    <b>Aim High Charitable Trust</b>
                  </ProjectLink>
                </CVHeading>
                <PointerEventHandler asChild type="underline">
                  <CVLink>
                    <Link
                      href={"https://www.aimhightrust.co.nz/"}
                      target="_blank"
                    >
                      {"https://www.aimhightrust.co.nz/"}
                    </Link>
                  </CVLink>
                </PointerEventHandler>

                <CVList className="mt-2">
                  <CVListItem>
                    A content website for a charity. The aim of this project was
                    for non-developers to maintain the website.
                  </CVListItem>
                  <CVListItem>Wordpress, php.</CVListItem>
                </CVList>
              </div>

              {/* Vault */}
              <div className="w-full">
                <CVSubHeading className="text-primary">2025</CVSubHeading>
                <CVHeading>
                  <b>Vault</b>
                </CVHeading>
                <PointerEventHandler asChild type="underline">
                  <CVLink>
                    <Link href={"https://vault.ryumy.com/"} target="_blank">
                      {"https://vault.ryumy.com/"}
                    </Link>
                  </CVLink>
                </PointerEventHandler>

                <CVList className="mt-2">
                  <CVListItem>
                    Personal storage for my photos. Upload and manage folder
                    structure and images in the blob storage.
                  </CVListItem>
                  <CVListItem>
                    Next.js, Drizzle, Cloudflare R2, PostgreSQL
                  </CVListItem>
                </CVList>
              </div>

              {/* Experience */}
              <SectionHeader text="Experience" />

              {/* McCann */}
              <div className="w-full">
                <CVSubHeading className="text-primary">
                  JUL 2022 - PRESENT
                </CVSubHeading>
                <CVHeading>
                  <b>
                    McCann <i>(formerly DDB)</i>, Auckland
                  </b>
                </CVHeading>

                <div className="flex gap-3">
                  <CVHeading>
                    <i>- Senior Frontend Developer</i>
                  </CVHeading>
                  <CVSubHeading className="text-primary mt-1.5">
                    OCT 2023 - PRESENT
                  </CVSubHeading>
                </div>

                <div className="flex gap-3">
                  <CVHeading>
                    <i>- Intermediate Frontend Developer</i>
                  </CVHeading>
                  <CVSubHeading className="text-primary mt-1.5">
                    JUL 2022 - OCT 2023
                  </CVSubHeading>
                </div>

                <CVList className="mt-2">
                  <CVListItem>
                    Responsible for mostly, but not limited to, frontend
                    development. This includes building and leading
                    award-winning works like a campaign website, PWA, large
                    content website and product-based web application.
                  </CVListItem>
                  <CVListItem>
                    Frontend — Three.js, R3F, Theatre.js, WebGL, Pixi.JS,
                    Playcanvas, Spark.js, MediaPipe, D3, Next.js, React, Vue.js,
                    Vite, Shadcn, motion (Framer Motion), GSAP, Tailwind CSS,
                    Storybook, PWA.
                  </CVListItem>
                  <CVListItem>
                    Backend — .NET C#, Umbraco CMS, Sanity, Algolia, Drizzle,
                    Prisma, PostgreSQL
                  </CVListItem>
                  <CVListItem>
                    Testing & others — Playwright, Docker, Orval, Swagger,
                    CI/CD.
                  </CVListItem>
                </CVList>
              </div>

              <div className="w-full">
                <CVSubHeading>
                  Participated in various award entries:
                </CVSubHeading>
                <CVList className="mt-2">
                  <PointerEventHandler type="bullet" asChild>
                    <Link
                      href="/work/fola"
                      className="underline text-secondary"
                    >
                      <CVListItem className="w-fit">
                        Festival of Live Art (F.O.L.A)
                      </CVListItem>
                    </Link>
                  </PointerEventHandler>
                  <CVSubList>
                    <CVListItem>
                      2025 Best Awards Small Scale Websites - Silver
                    </CVListItem>
                  </CVSubList>
                  <PointerEventHandler type="bullet" asChild>
                    <Link
                      href="/work/greenprint"
                      className="underline text-secondary"
                    >
                      <CVListItem className="w-fit">VW Greenprint</CVListItem>
                    </Link>
                  </PointerEventHandler>
                  <CVSubList>
                    <CVListItem>
                      2024 Best Awards Sustainable Industrial Design (SPD) -
                      Gold
                    </CVListItem>
                    <CVListItem>
                      2024 Best Awards Small Scale Website - Bronze
                    </CVListItem>
                    <CVListItem>
                      2024 Cannes Lions Engagement, Direct - Silver*
                    </CVListItem>
                    <CVListItem>
                      2024 Cannes Lions Brand Experience & Activation - Silver*
                    </CVListItem>
                  </CVSubList>

                  <PointerEventHandler type="bullet" asChild>
                    <Link
                      href="/work/real-watergate"
                      className="underline text-secondary"
                    >
                      <CVListItem className="w-fit">
                        The Real Watergate
                      </CVListItem>
                    </Link>
                  </PointerEventHandler>
                  <CVSubList>
                    <CVListItem>
                      2024 Best Awards Small Scale Websites - Silver
                    </CVListItem>
                  </CVSubList>
                  <CVListItem>Correct the internet</CVListItem>
                  <CVSubList>
                    <CVListItem>
                      2024 Best Awards Digital Campaigns - Gold
                    </CVListItem>
                    <CVListItem>
                      2023 Best Awards Social Good - Silver
                    </CVListItem>
                    <CVListItem>
                      2023 Best Awards Design Communication - Silver
                    </CVListItem>
                    <CVListItem>
                      2024 Cannes Lions Brand Experience & Activation - Silver*
                    </CVListItem>
                    <CVListItem>
                      2023 Use of Digital Platforms - Bronze**
                    </CVListItem>
                    <CVListItem>
                      2023 Co-creation & User Generated Content - Silver**
                    </CVListItem>
                    <CVListItem>
                      2024 Apac Effie Social Media Marketing - Silver***
                    </CVListItem>
                    <CVListItem>
                      2024 Apac Effie Positive Change Social Good: NonProfit -
                      Bronze***
                    </CVListItem>
                  </CVSubList>
                  <PointerEventHandler type="bullet" asChild>
                    <Link
                      href="/work/heritage-new-zealand"
                      className="underline text-secondary"
                    >
                      <CVListItem className="w-fit">
                        Heritage New Zealand Pouhere Taonga
                      </CVListItem>
                    </Link>
                  </PointerEventHandler>
                  <CVSubList>
                    <CVListItem>
                      2023 Best Awards Large Scale Websites - Bronze
                    </CVListItem>
                  </CVSubList>
                  <PointerEventHandler type="bullet" asChild>
                    <Link
                      href="https://www.fantasyherd.co.nz/"
                      target="_blank"
                      className="underline text-secondary"
                    >
                      <CVListItem className="w-fit">Fantasy Herd</CVListItem>
                    </Link>
                  </PointerEventHandler>
                  <CVSubList>
                    <CVListItem>
                      2026 Cannes Lion Creative Data Lions - Bronze****
                    </CVListItem>
                  </CVSubList>
                </CVList>
                <div className="mt-4 flex flex-col gap-1 text-muted-foreground">
                  <CVSubHeading>*Cannes Lions 2024</CVSubHeading>
                  <CVSubHeading>**Cannes Lions 2023</CVSubHeading>
                  <CVSubHeading>***Apac Effie 2024</CVSubHeading>
                  <CVSubHeading>****Cannes Lions 2026</CVSubHeading>
                </div>
              </div>

              {/* Infosys */}
              <div className="w-full">
                <CVSubHeading className="text-primary">
                  {"MAR 2021 - JUL 2022"}
                </CVSubHeading>
                <CVHeading>
                  <b>Infosys, Auckland</b>
                  <i>- Associate Developer</i>
                </CVHeading>

                <CVList className="mt-2">
                  <CVListItem>
                    Contractor in Spark NZ, responsible with backend for
                    frontend in the mobile team.
                  </CVListItem>
                  <CVListItem>Node.js Express</CVListItem>
                </CVList>
              </div>

              {/* Perpetual Guardian */}
              <div className="w-full">
                <CVSubHeading className="text-primary">
                  {"DEC 2018 - JUN 2019"}
                </CVSubHeading>
                <CVHeading>
                  <b>Perpetual Guardian, Auckland</b>
                  <i>- Junior Analyst Programmer</i>
                </CVHeading>

                <CVList className="mt-2">
                  <CVListItem>
                    Responsible for development of Footprint web application and
                    internal tools.
                    <CVSubList>
                      <CVListItem>
                        <PointerEventHandler asChild type="underline">
                          <CVLink>
                            <Link
                              href="https://www.myfootprint.co.nz/"
                              target="_blank"
                            >
                              https://www.myfootprint.co.nz/
                            </Link>
                          </CVLink>
                        </PointerEventHandler>
                      </CVListItem>
                    </CVSubList>
                  </CVListItem>
                  <CVListItem>Frontend - ReactJS</CVListItem>
                  <CVListItem>Backend - .NET Framework, C#</CVListItem>
                  <CVListItem>Testing - Selenium C#</CVListItem>
                </CVList>
              </div>

              {/* Education */}
              <SectionHeader text="Education" />

              <div className="w-full">
                <CVSubHeading className="text-primary">
                  {"2016 - 2021"}
                </CVSubHeading>
                <CVHeading>
                  <b>University of Auckland, New Zealand</b>
                  <i>- Bachelor of Engineering</i>
                </CVHeading>

                <CVList className="mt-2">
                  <CVListItem>
                    Specialisation in Computer Systems Engineering.
                  </CVListItem>
                </CVList>
              </div>

              {/* Skills */}
              <SectionHeader text="Skills" />

              <div className="w-full">
                <CVHeading>
                  <b>Frontend</b>
                </CVHeading>

                <CVDescription className="mt-2">
                  Three.js, R3F, Theatre.js, WebGL, Pixi.JS, Playcanvas,
                  Spark.js, MediaPipe, D3, Next.js, React, Vue.js, Vite, Svelte,
                  SvelteKit, HTML5, CSS3, Tailwind CSS, Shadcn, Storybook,
                  motion (Framer Motion), GSAP, Razor, Alpine.js, Lit,
                  Wordpress, php, PWA.
                </CVDescription>
              </div>

              <div className="w-full">
                <CVHeading>
                  <b>Backend</b>
                </CVHeading>

                <CVDescription className="mt-2">
                  C#, .NET, Umbraco, Sanity, Node.js, Express, Hono, PostgreSQL,
                  Drizzle, Prisma, Cloudflare R2, S3, Redis.
                </CVDescription>
              </div>

              <div className="w-full">
                <CVHeading>
                  <b>Testing</b>
                </CVHeading>

                <CVDescription className="mt-2">
                  Playwright, Selenium C#, Jest.
                </CVDescription>
              </div>

              <div className="w-full">
                <CVHeading>
                  <b>Others</b>
                </CVHeading>

                <CVDescription className="mt-2">
                  CI/CD, Lerna, Docker, Git, FFmpeg, HuggingFace, Orval,
                  Swagger, Figma
                </CVDescription>
              </div>
            </div>
          </Grid>
        </main>
      </SmoothScroll>
    </PageLayer>
  );
}
