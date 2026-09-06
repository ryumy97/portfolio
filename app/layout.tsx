import type { Metadata } from "next";
import { Lato, Playfair_Display } from "next/font/google";
import Header from "@/components/header";
import PageTransitionDriver from "@/components/page-transition-driver";
import ParticleDebugHud from "@/components/particle-debug-hud";
import Pointer from "@/components/pointer";
import ThemeProvider from "@/components/theme-provider";
import BackgroundCanvas from "./background-canvas";
import ForegroundCanvas from "./foreground-canvas";
import "./globals.css";

// Heading
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

// Body
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Ryumy",
  description: "Web portfolio by In Ha Ryu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${playfairDisplay.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="min-h-svh overflow-hidden pointer-events-auto">
        <ThemeProvider>
          <BackgroundCanvas />
          <PageTransitionDriver>{children}</PageTransitionDriver>
          <ForegroundCanvas />
          <Header />
          <Pointer />
          <ParticleDebugHud />
        </ThemeProvider>
      </body>
    </html>
  );
}
