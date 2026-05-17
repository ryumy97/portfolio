import Loader from "@/components/loader";
import { PageTunnelOut } from "@/components/page-tunnel";
import type { Metadata } from "next";
import { Lato, Playfair_Display } from "next/font/google";
import "../globals.css";
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
			className={`${playfairDisplay.variable} ${lato.variable} h-full antialiased cursor-none`}
		>
			<body className="min-h-screen bg-black overflow-hidden pointer-events-auto">
				{children}
				<PageTunnelOut />
				<Pointer />
				<Loader />
			</body>
		</html>
	);
}
