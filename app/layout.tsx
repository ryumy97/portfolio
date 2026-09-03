import HomeBackgroundCanvas from "@/app/home/background-canvas";
import Header from "@/components/header";
import PageTransitionDriver from "@/components/page-transition-driver";
import Pointer from "@/components/pointer";
import type { Metadata } from "next";
import { Lato, Playfair_Display } from "next/font/google";
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
      className={`${playfairDisplay.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="min-h-svh overflow-hidden pointer-events-auto">
        <PageTransitionDriver />
        <div className="relative z-10">{children}</div>
        <HomeBackgroundCanvas />
        <Header />
        <Pointer />
      </body>
    </html>
  );
}
