import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import {
  CVDescription,
  CVLink,
  CVList,
  CVListItem,
  CVSubHeading,
  CVSubList,
  PageDescription,
  Title,
} from "@/components/ui/typography";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import GithubIcon from "./assets/github.svg";
import LinkedinIcon from "./assets/linkedin.svg";
import Section, { ProjectLink, SubSection } from "./section";
import SectionHeader from "./section-header";

export default function Page() {
  return (
    <PageTunnelIn>
      <SmoothScroll horizontal>
        <PageDescription className="absolute bottom-4 right-4 flex items-center gap-[1vw] justify-center">
          Scroll this way{" "}
          <ArrowRightIcon className="w-[min(max(2vw,16px),24px)]" />
        </PageDescription>
        <main className="flex min-h-svh w-max items-center gap-[10vw] md:gap-[5vw] px-8">
          <div className="md:max-w-[20vw] max-w-[50vw] w-full">
            <Title className="">
              <div className="text-primary">About</div>
              <div className="mt-2">In Ha Ryu</div>
            </Title>
            <PageDescription className="w-full mt-[2.5vw] md:mt-[1vw]">
              <span>
                Cogito
                <span className={"text-primary"}>,</span>{" "}
              </span>
              <span>
                ergo sum
                <span className={"text-primary"}>.</span>
              </span>
            </PageDescription>
            <div className="flex flex-col mt-2">
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
                  <CVLink asChild>
                    <Link href={"tel:+642102831932"} target="_blank">
                      (+64) 21 028 31932
                    </Link>
                  </CVLink>
                </PointerEventHandler>
              </div>

              <div>
                <PointerEventHandler type="underline" asChild>
                  <CVLink asChild>
                    <Link href={"mailto:INHA.RYU.97@GMAIL.COM"} target="_blank">
                      INHA.RYU.97@GMAIL.COM
                    </Link>
                  </CVLink>
                </PointerEventHandler>
              </div>
              <div>
                <PointerEventHandler type="underline" asChild>
                  <CVLink asChild>
                    <Link href="/CV.pdf" target="_blank">
                      Download CV
                    </Link>
                  </CVLink>
                </PointerEventHandler>
              </div>
            </div>
          </div>

          <SectionHeader text="Personal" />

          {/* Reflct */}
          <Section
            subtitle="AUG 2024 - PRESENT"
            title={
              <>
                <ProjectLink link="/projects/reflct">
                  <b>Reflct</b>
                </ProjectLink>
                <i>- Co founder & Developer</i>
              </>
            }
            link="https://www.reflct.app/"
          >
            <CVDescription>
              Designed, built and launched a web platform featuring a 3D
              Gaussian splat scene editor as well as a published npm package as
              an embeddable viewer library in React. This includes full-stack
              architecture of uploading and transforming 3DGS data to DB and
              blob storage, user authentication, payment integration of a
              subscription model, implementing a cache layer, end-to-end testing
              and a CI/CD pipeline of both the web app and packages.
            </CVDescription>
            <CVList className="mt-2">
              <CVListItem>
                A platform to easily manage and deploy 3D Gaussian Splatting
                (3DGS) scenes into the website.
              </CVListItem>
              <CVListItem>
                Next.js, React, Playcanvas, WebGL, Lerna, Clerk, Stripe, Hono,
                Redis, Prisma, PostgreSQL, S3, Playwright, CI/CD.
              </CVListItem>
              <CVListItem>
                @reflct/react npm package -
                <CVSubList>
                  <CVListItem>
                    <PointerEventHandler asChild type="underline">
                      <CVLink asChild>
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
                      <CVLink asChild>
                        <Link href="https://github.com/Reflct" target="_blank">
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
                      <CVLink asChild>
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
          </Section>

          {/* Typography */}
          <Section
            subtitle="2022"
            title={
              <ProjectLink link="/projects/typography">
                <b>Typography</b>
              </ProjectLink>
            }
            link="https://typography.ryumy.com/"
          >
            <CVList className="mt-2">
              <CVListItem>
                Mini project holding a collection of interactive experiences.
              </CVListItem>
              <CVListItem>Simple HTML5, Javascript, CSS, Pixi.JS</CVListItem>
              <CVListItem>
                Github -
                <CVSubList>
                  <CVListItem>
                    <PointerEventHandler asChild type="underline">
                      <CVLink asChild>
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
          </Section>

          {/* Kiwi */}
          <Section
            subtitle="2021"
            title={
              <ProjectLink link="/projects/kiwi">
                <b>Kiwi</b>
              </ProjectLink>
            }
            link="https://kiwi.ryumy.com/"
          >
            <CVList className="mt-2">
              <CVListItem>
                A simple interactive environment without any external libraries.
              </CVListItem>
              <CVListItem>Simple HTML5, Javascript, CSS</CVListItem>
              <CVListItem>
                Github -
                <CVSubList>
                  <CVListItem>
                    <PointerEventHandler asChild type="underline">
                      <CVLink asChild>
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
          </Section>

          {/* Aim High Charitable Trust */}
          <Section
            subtitle="2020"
            title={
              <ProjectLink link="/projects/aimhigh">
                <b>Aim High Charitable Trust</b>
              </ProjectLink>
            }
            link="https://www.aimhightrust.co.nz/"
          >
            <CVList className="mt-2">
              <CVListItem>
                A content website for a charity. The aim of this project was for
                non-developers to maintain the website.
              </CVListItem>
              <CVListItem>Wordpress, php.</CVListItem>
            </CVList>
          </Section>

          {/* Vault */}
          <Section
            subtitle="2025"
            title={<b>Vault</b>}
            link="https://vault.ryumy.com/"
          >
            <CVList className="mt-2">
              <CVListItem>
                Personal storage for my photos. Upload and manage folder
                structure and images in the blob storage.
              </CVListItem>
              <CVListItem>
                Next.js, Drizzle, Cloudflare R2, PostgreSQL
              </CVListItem>
            </CVList>
          </Section>

          {/* Experience */}
          <SectionHeader text="Experience" />

          {/* McCann */}
          <Section
            subtitle="JUL 2022 - PRESENT"
            title={
              <>
                <b>
                  McCann <i>(formerly DDB)</i>, Auckland
                </b>
                <i>- Senior Frontend Developer</i>
              </>
            }
          >
            <CVList className="mt-2">
              <CVListItem>
                Responsible for mostly, but not limited to, frontend
                development. This includes building and leading award-winning
                works like a campaign website, PWA, large content website and
                product-based web application.
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
                Testing & others — Playwright, Docker, Orval, Swagger, CI/CD.
              </CVListItem>
            </CVList>
          </Section>

          <SubSection>
            <CVSubHeading>Participated in various award entries:</CVSubHeading>
            <CVList className="mt-2">
              <PointerEventHandler type="bullet" asChild>
                <Link
                  href="/projects/fola"
                  className="underline text-secondary"
                >
                  <CVListItem>Festival of Live Art (F.O.L.A)</CVListItem>
                </Link>
              </PointerEventHandler>
              <CVSubList>
                <CVListItem>
                  2025 Best Awards Small Scale Websites - Silver
                </CVListItem>
              </CVSubList>
              <PointerEventHandler type="bullet" asChild>
                <Link
                  href="/projects/greenprint"
                  className="underline text-secondary"
                >
                  <CVListItem>VW Greenprint</CVListItem>
                </Link>
              </PointerEventHandler>
              <CVSubList>
                <CVListItem>
                  2024 Best Awards Sustainable Industrial Design (SPD) - Gold
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
                  href="/projects/real-watergate"
                  className="underline text-secondary"
                >
                  <CVListItem>The Real Watergate</CVListItem>
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
                <CVListItem>2023 Best Awards Social Good - Silver</CVListItem>
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
                  href="/projects/heritage-new-zealand"
                  className="underline text-secondary"
                >
                  <CVListItem>Heritage New Zealand Pouhere Taonga</CVListItem>
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
                  <CVListItem>Fantasy Herd</CVListItem>
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
          </SubSection>

          {/* Infosys */}
          <Section
            subtitle={"MAR 2021 - JUL 2022"}
            title={
              <>
                <b>Infosys, Auckland</b>
                <i>- Associate Developer</i>
              </>
            }
          >
            <CVList className="mt-2">
              <CVListItem>
                Contractor in Spark NZ, responsible with backend for frontend in
                the mobile team.
              </CVListItem>
              <CVListItem>Node.js Express</CVListItem>
            </CVList>
          </Section>

          {/* Perpetual Guardian */}
          <Section
            subtitle={"DEC 2018 - JUN 2019"}
            title={
              <>
                <b>Perpetual Guardian, Auckland</b>
                <i>- Junior Analyst Programmer</i>
              </>
            }
          >
            <CVList className="mt-2">
              <CVListItem>
                Responsible for development of Footprint web application and
                internal tools.
                <CVSubList>
                  <CVListItem>
                    <PointerEventHandler asChild type="underline">
                      <CVLink asChild>
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
          </Section>

          {/* Education */}
          <SectionHeader text="Education" />

          <Section
            subtitle={"2016 - 2021"}
            title={
              <>
                <b>University of Auckland, New Zealand</b>
                <i>- Bachelor of Engineering</i>
              </>
            }
          >
            <CVList className="mt-2">
              <CVListItem>
                Specialisation in Computer Systems Engineering.
              </CVListItem>
            </CVList>
          </Section>

          {/* Skills */}
          <SectionHeader text="Skills" />

          <Section title={<b>Frontend</b>}>
            <CVDescription className="mt-2">
              Three.js, R3F, Theatre.js, WebGL, Pixi.JS, Playcanvas, Spark.js,
              MediaPipe, D3, Next.js, React, Vue.js, Vite, Svelte, SvelteKit,
              HTML5, CSS3, Tailwind CSS, Shadcn, Storybook, motion (Framer
              Motion), GSAP, Razor, Alpine.js, Lit, Wordpress, php, PWA.
            </CVDescription>
          </Section>

          <Section title={<b>Backend</b>}>
            <CVDescription className="mt-2">
              C#, .NET, Umbraco, Sanity, Node.js, Express, Hono, PostgreSQL,
              Drizzle, Prisma, Cloudflare R2, S3, Redis.
            </CVDescription>
          </Section>

          <Section title={<b>Testing</b>}>
            <CVDescription className="mt-2">
              Playwright, Selenium C#, Jest.
            </CVDescription>
          </Section>

          <Section title={<b>Others</b>}>
            <CVDescription className="mt-2">
              CI/CD, Lerna, Docker, Git, FFmpeg, HuggingFace, Orval, Swagger,
              Figma
            </CVDescription>
          </Section>
        </main>
      </SmoothScroll>
    </PageTunnelIn>
  );
}
