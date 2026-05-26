"use client";

import Header from "@/components/header";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import SmoothScroll from "@/components/smooth-scroll";
import {
	CVHeading,
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
import SectionHeader from "./section-header";
import Section, { SubSection } from "./section";

export default function Page() {
	return (
		<PageTunnelIn>
			<SmoothScroll horizontal>
				<Header />
				<PageDescription className="absolute bottom-4 right-4 flex items-center gap-[1vw] justify-center">
					Scroll this way{" "}
					<ArrowRightIcon className="w-[min(max(2vw,16px),24px)]" />
				</PageDescription>
				<main className="flex min-h-screen w-max items-center gap-[10vw] md:gap-[5vw] px-8">
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
					</div>

					<SectionHeader text="Personal" />

					{/* Reflct */}
					<Section
						subtitle="AUG 2024 - PRESENT"
						title={
							<>
								<b>Reflct</b> <i>- Co founder & Developer</i>
							</>
						}
						link="https://www.reflct.app/"
					>
						<CVList className="mt-2">
							<CVListItem>
								Platform to easily manage and deploy 3D Gaussian Splatting
								(3DGS) scenes into the website.
							</CVListItem>

							<CVListItem>
								@reflct/react npm package
								<CVSubList>
									<CVListItem>
										<CVLink asChild>
											<PointerEventHandler asChild type="underline">
												<Link
													href="https://www.npmjs.com/package/@reflct/react"
													target="_blank"
												>
													https://www.npmjs.com/package/@reflct/react
												</Link>
											</PointerEventHandler>
										</CVLink>
									</CVListItem>
								</CVSubList>
							</CVListItem>
						</CVList>
					</Section>

					{/* Typography */}
					<Section
						subtitle="2022"
						title={<b>Typography</b>}
						link="https://typography.ryumy.com/"
					>
						<CVList className="mt-2">
							<CVListItem>
								Mini project holding a collection of interactive experiences.
							</CVListItem>
							<CVListItem>Pixi.js and others.</CVListItem>
						</CVList>
					</Section>

					{/* Kiwi */}
					<Section
						subtitle="2021"
						title={<b>Kiwi</b>}
						link="https://kiwi.ryumy.com/"
					>
						<CVList className="mt-2">
							<CVListItem>
								A simple interactive environment without any external libraries.
							</CVListItem>
						</CVList>
					</Section>

					{/* Aim High Charitable Trust */}
					<Section
						subtitle="2020"
						title={<b>Aim High Charitable Trust</b>}
						link="https://www.aimhightrust.co.nz/"
					>
						<CVList className="mt-2">
							<CVListItem>
								Provide a website that can be managed by non-developers.
							</CVListItem>
							<CVListItem>
								Wordpress was used to build the website and provide CMS.
							</CVListItem>
						</CVList>
					</Section>

					{/* Vault */}
					<Section
						subtitle="2025"
						title={<b>Vault</b>}
						link="https://vault.ryumy.com/"
					>
						<CVList className="mt-2">
							<CVListItem>Personal Storage for my photos</CVListItem>
							<CVListItem>
								Next.js, Drizzle, NeonDB (PostgreSQL), Cloudflare R2 (S3)
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
								<i>- Intermediate/Senior Frontend Developer</i>
							</>
						}
						link="https://vault.ryumy.com/"
					>
						<CVList className="mt-2">
							<CVListItem>
								Numerous web/digital experiences for clients ranging from
								micro-sites to large content websites.
							</CVListItem>
						</CVList>
					</Section>

					<SubSection>
						<CVSubHeading>Participated in various awards:</CVSubHeading>
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
									href="/projects/vw-greenprint"
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
									href="/projects/the-real-watergate"
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
									2024 Cannes Lions Brand Experience & Activation - Silver
								</CVListItem>
								<CVListItem>2023 Use of Digital Platforms - Bronze</CVListItem>
								<CVListItem>
									2023 Co-creation & User Generated Content - Silver
								</CVListItem>
								<CVListItem>
									2024 Apac Effie Social Media Marketing - Silver
								</CVListItem>
								<CVListItem>
									2024 Apac Effie Positive Change Social Good: NonProfit -
									Bronze
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
						</CVList>
					</SubSection>

					{/* Infosys */}
					<Section
						subtitle={"MAY 2020 - FEB 2022"}
						title={
							<>
								<b>Infosys, Auckland</b>
								<i>- Associate Developer</i>
							</>
						}
						link={""}
					>
						<CVList className="mt-2">
							<CVListItem>Contractor in Spark NZ.</CVListItem>
							<CVListItem>
								Node.js Express - backend for frontend mobile
							</CVListItem>
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
						link={""}
					>
						<CVList className="mt-2">
							<CVListItem>Frontend - ReactJS</CVListItem>
							<CVListItem>Backend - .NET Framework, C#</CVListItem>
							<CVListItem>Automation testing - Selenium C#</CVListItem>
						</CVList>
					</Section>

					{/* Education */}
					<SectionHeader text="Education" />

					{/* Perpetual Guardian */}
					<Section
						subtitle={"2016 - 2020"}
						title={
							<>
								<b>University of Auckland, New Zealand</b>
								<i>- Bachelor of Engineering</i>
							</>
						}
						link={""}
					>
						<CVList className="mt-2">
							<CVListItem>
								Specialisation in Computer Systems Engineering.
							</CVListItem>
						</CVList>
					</Section>

					{/* Education */}
					<SectionHeader text="Contact" />

					<SubSection>
						<CVList className="w-full mt-[1vw]">
							<PointerEventHandler asChild type="bullet">
								<a href="tel:+642102831932">
									<CVListItem>(+64) 21 028 31932</CVListItem>
								</a>
							</PointerEventHandler>
							<PointerEventHandler asChild type="bullet">
								<a href="mailto:INHA.RYU.97@GMAIL.COM">
									<CVListItem>INHA.RYU.97@GMAIL.COM</CVListItem>
								</a>
							</PointerEventHandler>
						</CVList>
					</SubSection>
				</main>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
