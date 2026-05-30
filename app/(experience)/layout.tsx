import type { Metadata } from "next";
import { Lato, Playfair_Display } from "next/font/google";
import Loader from "@/components/loader";
import { PageTunnelOut } from "@/components/page-tunnel";
import "../globals.css";
import Header from "@/components/header";
import Pointer from "@/components/pointer";

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
	description: "Web portfolio by Ryumy",
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
			<body className="min-h-screen bg-background overflow-hidden pointer-events-auto">
				{children}
				<Header />
				<PageTunnelOut />
				<Pointer />
				<Loader />
			</body>
		</html>
	);
}
