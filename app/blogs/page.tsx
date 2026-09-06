"use client";

import { motion } from "motion/react";
import PageLayer from "@/components/page-layer";
import SmoothScroll from "@/components/smooth-scroll";
import Link from "@/components/transition-link";

export default function Page2() {
  return (
    <PageLayer>
      <motion.div
        key="page2"
        className="relative bg-background min-h-svh"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.5 }}
      >
        <SmoothScroll horizontal>
          <main className="flex min-h-svh w-max items-center gap-4 px-8">
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
    </PageLayer>
  );
}
