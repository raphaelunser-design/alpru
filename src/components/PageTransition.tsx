"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" as const };
  const initial = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 };
  const animate = { opacity: 1, y: 0 };
  const exit = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className="w-full min-w-0 overflow-x-hidden"
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
