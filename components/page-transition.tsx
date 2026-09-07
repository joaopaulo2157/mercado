"use client";

import { LazyMotion, m, useReducedMotion } from "motion/react";

const loadMotionFeatures = () =>
  import("@/components/motion-features").then((module) => module.default);

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <m.div
        className="page-transition"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
