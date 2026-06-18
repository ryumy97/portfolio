"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";

export default function Page2() {
  return (
    <PageTunnelIn>
      <motion.div
        key="page2"
        className="relative bg-background min-h-screen"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.5 }}
      >
        <SmoothScroll horizontal>
          <main className="flex min-h-screen w-max items-center gap-4 px-8">
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <div className="h-96 w-lg shrink-0 bg-red-500"></div>
            <Link href="/">Home</Link>
          </main>
        </SmoothScroll>
      </motion.div>
    </PageTunnelIn>
  );
}
